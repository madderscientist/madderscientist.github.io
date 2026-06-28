---
title: 校外远程开机校园网内的电脑
pubDate: 2026-06-21
description: 校外远程开机校园网电脑的完整折腾记录。面临网页认证和无有线接入两大难题，最终用树莓派作为常开跳板，通过GPIO短接主板开机引脚实现唤醒，同时以WoL作为保底方案。文章涵盖：校园网认证逆向分析、树莓派GPIO继电器控制、IPv6公网访问、Nginx+acme.sh配置HTTPS、FastAPI后端服务开发，以及Windows端C++编写的轻量级HTTP服务。适合对远程运维、树莓派应用、校园网穿透感兴趣的开发者参考
tags: [技术, 网络, 树莓派]
---

学业需要，直博的后面四年将在北京度过。上学期找校内导师嫖了个工位电脑，是本人至今用过最好的配置，非常舍不得；然而由于设备已经入库，带不走。因此需要一个远程使用的方法。

最简单的方法是保持电脑开机。但是考虑到五年后按计划报废，到时候设备还是归我，一直开机只怕硬件磨损，而且也不环保，于是我希望能远程开关机。

## 问题分析
已有条件：
1. 通过学校的 VPN 可以远程连接校内电脑，只需要知道局域网IP，而这可以在学校的APP内查到。所以只要保证设备连上了校园网。
2. 学校的IPV6是公网，虽然不够稳定

最大的障碍有两个：
1. **通过浏览器认证的校园网。** 这直接导致开机卡用不了（说明书明确网页认证情况不可用）；基于智能插座的方案也因此行不通。要能做到联网，需要对网页认证的逆向，然后发起网络请求（见后文）。但对于这种物联网硬件设备，我做不到让其发起我想要的网络请求。
2. **学校不提供有线接入。** 这直接导致无法使用 Wake on LAN。虽然还有 Wake on Wireless LAN，但由于校园网由多个路由器子网构成，而魔术包只在同一个局域网内有效（AI说的，我没验证过），因此也无法使用。

实在不行…… 那就只能保持开机了？

——诶，其实不必是目标电脑保持开机，只要有一个网络设备、在同一个局域网内保持开机、且我可以访问到就行。思路打开！只要找一个~~黑奴~~可以随便折腾的设备就行啦！

头号候选：路由器，本身就是为了常开而设计的。遗憾的是，路由器做不到校园网认证，导致我无法获取路由器的地址。家里的路由器也不支持第三方固件，无法刷机。手头的路由器更是连不上校园网，因为过于老旧而不支持5GHz。

于是我想到了我放在家里的树莓派。既可以执行任意代码，又拥有 GPIO，而且性能本来就很差，长时间开机无人怜惜。只要我保证树莓派在线，先远程连接到树莓派上，再用 GPIO 短接开机引脚就可以了！

其实还有一个备选：ESP32。但我不会。

## 校园网认证逆向
比较简单，[代码在这](https://github.com/madderscientist/codeRoad/tree/main/SEU-WLAN)。这份代码会运行在树莓派和电脑上，要有一定的鲁棒性。已经经过了半周的实验，目前平稳运行中~

机制为：用计划任务实现刚开机的联网、每天定时刷新校园网（登出后登录）

## 开机唤醒
### GPIO 短接开机引脚
主机开机的原理是：开机引脚短接到地线（电平下拉）。树莓派的 GPIO 不能直接接触主机的开机引脚，否则有可能烧坏引脚。因此需要一个继电器模块进行隔离。继电器分为低电平触发和高电平触发两种，考虑到通用性，应该选择低电平触发的继电器。

找学弟要了一个继电器模块，恰好就是低电平触发的。只是产品说明有些让人迷糊：额定电压 5V，触发范围 0~3.8V。实际测试发现，控制端 3.3V 确实无法触发继电器，但是只要将供电电压改为 3.3V 就可以了。此外，当控制输入为高阻时，并不会误触发，因为需要 2mA 的电流。

然而又发现，3.3V 供电并不能保证继电器吸合。但柳暗花明的是，树莓派 GPIO 在释放后会进入高阻态。所以最后变成了：继电器接树莓派5V供电，控制引脚输出任意电平（高/低）→继电器吸合；GPIO 释放，高阻态→继电器断开。
```py title="GPIO控制继电器示例.py"
import time
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_OFF)  # 输入状态是高阻的

print("等待2秒...")
time.sleep(2)
print("吸合")
GPIO.setup(17, GPIO.OUT, initial=GPIO.LOW)
time.sleep(2)
print("断开")
GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_OFF)
print("电脑应该开始开机了")
```
没有工具，做一根Y形导线都费我老命了…… 希望这两根线能坚持四年吧。

### 保底：WoL
除了短接，我还设计了保底的方案：用网线连接主机，走 Wake on LAN 路线唤醒。所以最终还有一根网线连接树莓派和主机。设置树莓派的 LAN ipv4 地址为 `192.168.137.200`，设置主机为 `192.168.137.201`。

主机端配置：BIOS 里开启 `Power On By PCI-E`，关闭 `ErP ready`，电源里关闭快速启动。此时关机后可以发现插着网线的网卡灯会一直亮着。

如何唤醒呢？用 `wakeonlan` 包怎么也唤不醒（真的试了很久！）。所以只能从底层写：
```py title="发送 WoL 魔术包示例.py"
import socket

def send_wol(mac, broadcast='192.168.137.255', ports=[7, 9]):
    # 清理 MAC 地址
    mac_clean = mac.replace('-', '').replace(':', '').replace('.', '')
    mac_bytes = bytes.fromhex(mac_clean)
    # 构建魔术包：6个 0xFF + 16次重复 MAC
    magic_packet = b'\xff' * 6 + mac_bytes * 16
    # 发送 UDP 广播
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    for port in ports:
        sock.sendto(magic_packet, (broadcast, port))
    sock.close()
```
关于WOL的稳定性，我做了点小实验：
- 保证树莓派能WOL唤醒后，拔了网线再插回去——仍可以唤醒
- 保证树莓派能WOL唤醒后，拔了网线插入到笔记本——仍可以唤醒
- 保证树莓派能WOL唤醒后，长按关机键强制关机，再试图唤醒——不能唤醒

所以以后不能长按关机了，那得给主机配置一个关机的接口，见下。


## 主机端
由于 WoL 需要用网线将树莓派和主机连接起来，因此可以让树莓派通过以太网获取主机的 ipv6 地址，这样省得我用VPN进行远程连接了。这需要 windows 主机开启一个网络服务，监听树莓派的请求，返回自己的 ipv6 地址。为了减少性能开销、保持电脑整洁，我选择用 C++（AI给的方案都是Go之类要额外安装的，而MSVC是现成的）。目标是：在 9001 上开启一个 HTTP 服务，提供一个 `/ipv6` 的 GET 接口，返回主机的 ipv6 地址；此外还有一个 `/shutdown` 的 POST 接口，执行关机命令。

这年头只要让 AI 写就可以了（想到没有AI之前为了写一个小桌面功能去学了一周的Win32编程，哭），代码如下：
```cpp
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <iphlpapi.h>
#include <stdio.h>
#include <string>
#include <vector>
#include <sstream>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "iphlpapi.lib")

// ============================================
// 1. 获取 WiFi 适配器的全局 IPv6 地址
// ============================================
static std::string GetWiFiIPv6() {
    // 使用栈内存，避免堆分配开销
    BYTE buffer[15000]{};
    ULONG bufferSize = sizeof(buffer);
    PIP_ADAPTER_ADDRESSES pAdapter = (PIP_ADAPTER_ADDRESSES)buffer;

    // 指定 AF_INET6 并跳过无关数据，让系统底层开销最小化
    DWORD ret = GetAdaptersAddresses(
        AF_INET6,
        GAA_FLAG_SKIP_ANYCAST | GAA_FLAG_SKIP_MULTICAST | GAA_FLAG_SKIP_DNS_SERVER,
        nullptr,
        pAdapter,
        &bufferSize
    );

    if (ret != NO_ERROR) return "";

    for (PIP_ADAPTER_ADDRESSES p = pAdapter; p != nullptr; p = p->Next) {
        // 匹配 WiFi 适配器名称
        std::wstring name(p->FriendlyName);
        if (name.find(L"WiFi") == std::wstring::npos &&
            name.find(L"Wireless") == std::wstring::npos &&
            name.find(L"WLAN") == std::wstring::npos) {
            continue;
        }

        // 遍历该适配器的单播地址
        for (PIP_ADAPTER_UNICAST_ADDRESS pAddr = p->FirstUnicastAddress; pAddr != nullptr; pAddr = pAddr->Next) {
            sockaddr_in6* sa6 = (sockaddr_in6*)pAddr->Address.lpSockaddr;

            // 跳过 fe80 开头的链路本地地址，只返回全局 IPv6
            if (IN6_IS_ADDR_LINKLOCAL(&sa6->sin6_addr)) {
                continue;
            }

            // 找到第一个全局 IPv6 地址，转换并返回
            char ipStr[INET6_ADDRSTRLEN];
            inet_ntop(AF_INET6, &sa6->sin6_addr, ipStr, sizeof(ipStr));
            return std::string(ipStr);
        }
    }
    return "";
}

// ============================================
// 2. HTTP 响应构造
// ============================================
static std::string BuildHttpResponse(const std::string& ipv6) {
    std::ostringstream response;
    response << "HTTP/1.1 200 OK\r\n"
        << "Content-Type: application/json\r\n"
        << "Connection: close\r\n"
        << "\r\n"
        << "{\"wifi_ipv6\":\"" << ipv6 << "\"}\r\n";
    return response.str();
}

// ============================================
// 3. 提取 HTTP 请求的方法 (Method) 和路径 (Path)
// ============================================
static bool ParseHttpRequest(const char* buffer, int len, std::string& method, std::string& path) {
    if (len < 5) return false; // 至少需要 "GET / "

    // 1. 提取 Method (到第一个空格为止)
    const char* methodStart = buffer;
    const char* methodEnd = methodStart;
    while (methodEnd < buffer + len && *methodEnd != ' ') methodEnd++;
    if (methodEnd >= buffer + len) return false;
    method = std::string(methodStart, methodEnd - methodStart);

    // 2. 提取 Path (Method 后的空格之后，到下一个空格/回车/换行之前)
    const char* pathStart = methodEnd + 1;
    const char* pathEnd = pathStart;
    while (pathEnd < buffer + len && *pathEnd != ' ' && *pathEnd != '\r' && *pathEnd != '\n') pathEnd++;
    if (pathEnd <= pathStart) return false;
    path = std::string(pathStart, pathEnd - pathStart);

    return true;
}

// 辅助函数：为当前进程启用关机权限
static bool EnableShutdownPrivilege() {
    HANDLE hToken;
    TOKEN_PRIVILEGES tkp;

    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, &hToken)) {
        return false;
    }

    LookupPrivilegeValue(NULL, SE_SHUTDOWN_NAME, &tkp.Privileges[0].Luid);
    tkp.PrivilegeCount = 1;
    tkp.Privileges[0].Attributes = SE_PRIVILEGE_ENABLED;

    BOOL result = AdjustTokenPrivileges(hToken, FALSE, &tkp, 0, (PTOKEN_PRIVILEGES)NULL, 0);
    CloseHandle(hToken);

    return (result && GetLastError() == ERROR_SUCCESS);
}

int main() {
    // 初始化 Winsock
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        printf("WSAStartup failed\n");
        return 1;
    }

    // 创建 IPv6 Socket（双栈模式）
    SOCKET listenSocket = socket(AF_INET6, SOCK_STREAM, IPPROTO_TCP);
    if (listenSocket == INVALID_SOCKET) {
        printf("socket failed\n");
        WSACleanup();
        return 1;
    }

    // 禁用 IPV6_V6ONLY，允许 IPv4 映射连接
    int v6Only = 0;
    setsockopt(listenSocket, IPPROTO_IPV6, IPV6_V6ONLY, (char*)&v6Only, sizeof(v6Only));

    // 绑定到所有接口的 9001 端口
    sockaddr_in6 serverAddr = {};
    serverAddr.sin6_family = AF_INET6;
    serverAddr.sin6_addr = in6addr_any;
    serverAddr.sin6_port = htons(9001);

    if (bind(listenSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        printf("bind failed: %d\n", WSAGetLastError());
        closesocket(listenSocket);
        WSACleanup();
        return 1;
    }

    if (listen(listenSocket, SOMAXCONN) == SOCKET_ERROR) {
        printf("listen failed\n");
        closesocket(listenSocket);
        WSACleanup();
        return 1;
    }

    // 主循环
    while (true) {
        sockaddr_storage clientAddr = {};
        int addrLen = sizeof(clientAddr);
        SOCKET clientSocket = accept(listenSocket, (sockaddr*)&clientAddr, &addrLen);

        if (clientSocket == INVALID_SOCKET) continue;

        // 设置接收超时为 5 秒 防止客户端连接后不发数据导致 recv 永久阻塞，从而引发 Socket 句柄泄漏
        DWORD timeout = 5000;
        setsockopt(clientSocket, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout));

        // 接收请求并提取路径
        char buffer[1024]{};
        int recvLen = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);

        if (recvLen > 0) {
            std::string method, path;
            if (ParseHttpRequest(buffer, recvLen, method, path)) {
                // 【路由 1】获取 IPv6 地址
                if (method == "GET" && path == "/ipv6") {
                    std::string wifiIPv6 = GetWiFiIPv6();
                    if (wifiIPv6.empty()) wifiIPv6 = "not_found";
                    std::string response = BuildHttpResponse(wifiIPv6);
                    send(clientSocket, response.c_str(), (int)response.length(), 0);
                }
                // 【路由 2】处理 POST /shutdown 关机请求
                else if (method == "POST" && path == "/shutdown") {
                    const char* resp = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"result\":0}";
                    send(clientSocket, resp, (int)strlen(resp), 0);
                    // 1. 立即关闭当前客户端连接，释放资源
                    closesocket(clientSocket);
                    // 2. 尝试赋予关机权限
                    EnableShutdownPrivilege();
                    // 换回 InitiateSystemShutdownW
                    if (!InitiateSystemShutdownW(
                        NULL,   // lpMachineName
                        NULL,   // lpMessage
                        0,      // dwTimeout
                        TRUE,   // bForceAppsClosed
                        FALSE   // bRebootAfterShutdown
                    )) {
                        printf("Failed to initiate shutdown! Error: %d\n", GetLastError());
                    }
                    continue;
                }
                // 【默认】404 Not Found
                else {
                    std::string response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                    send(clientSocket, response.c_str(), (int)response.length(), 0);
                }
            }
        }
        // 无论成功、失败还是超时，都确保关闭连接释放资源
        closesocket(clientSocket);
    }

    closesocket(listenSocket);
    WSACleanup();
    return 0;
}
```
使用 `servy` 将 exe 注册为服务，使用最高权限。还需要放行tcp的9001端口（不过servy似乎会自动增加入站规则）。


## 树莓派端
是我第一次面向公网的服务器配置，补充了很多基础知识。
下文中，域名都用 `domain` 代指了；树莓派我的用户名是 `beshar`。

### HTTPS
由于开机功能过于敏感，因此请求最好在https上，因此需要一个域名，于是找哥们又要了一个子域名。ddns绑定过程略，每天三次更新。

#### IPV6:80 可用性测试
上学期在windows上进行过HTTPS的认证，发现SEU校园网开放了80端口（可让那哥们羡慕坏了）。但是上个月有一次网络升级，不知道有没有给我ban了，所以要先尝试一下：
```bash
sudo python -m http.server 80
```

但是连不上，就算域名换成ipv6地址也不行。但是之前配置过的windows电脑上却可以。折腾了半天，怀疑过工位的路由器，最后发现浏览器上访问报错是**拒绝连接** —— 原来是树莓派的问题。

询问AI发现linux中要显式指明ipv6：
```bash
sudo python -m http.server 80 --bind ::
```
而windows上默认开启双栈功能，不需要显式指名。

所以 IPV6:80 完全可用！

#### 证书申请
使用 `acme.sh` 申请证书。之前windows上用的也是 `win acme`。

没有 Nginx ，所以用 standalone 模式。但是认证需要开放 80 接口，而 80 端口的开放是要 `sudo` 的，然而官方文档的 standalong 并没有用，且还专门有一个 `sudo wiki`，开篇第一句就是 “Do not use sudo if you cannot properly configure it.” 果不其然，认证失败了。尝试了用 `sudo setcap 'cap_net_bind_service=+ep' /usr/bin/python3.13` 允许脚本，但是考虑到更新证书也需要80端口，所以还是放弃了这个方案。

无奈，只能直接在 root 下执行，一次就跑通了：
```sh title="root" frame="terminal"
acme.sh --issue --standalone -d domain --listen-v6 --server letsencrypt
```

下面要将证书复制到到一般用户可用的地方。依据官方文档：
```sh title="root" frame="terminal"
acme.sh --install-cert -d domain \
    --key-file /home/beshar/ssl/domain.key \
    --fullchain-file /home/beshar/ssl/domain.crt \
    --reloadcmd "chown beshar:beshar /home/beshar/ssl/*"
```
那在 `crontab` 里的到期更新执行后（安装 `acme` 后会自动注册一个续期的计划任务），证书不就变了吗？如何同步呢？原来 `--install-cert` 会自动记录，到期后会一样执行。所以这里的 `--reloadcmd` 非常重要，相当于回调。上面的 `--reloadcmd` 命令只是修改了证书的权限，保证一般用户可以访问，但我还需要重启用到https的进程。这意味着我要将后端配置成服务…… 那干脆上 nginx 算了！我的老天，要是早就用了nginx，也不会在standalong上折腾了这么久。下面是配置完 Nginx 后的证书安装指令：
```sh title="root" frame="terminal"
acme.sh --install-cert -d domain \
  --key-file /home/beshar/ssl/domain.key \
  --fullchain-file /home/beshar/ssl/fullchain.cer \
  --reloadcmd "chown beshar:beshar /home/beshar/ssl/* && systemctl reload nginx"
```

### Nginx 配置
这是我第二次用 nginx，第一次还是大一的时候第一次用云服务器，对 linux 啥都不懂时照猫画虎的。下面简记过程：

```bash title="启用nginx"
# 安装
sudo apt install nginx
# 服务启动与自启
sudo systemctl start nginx
sudo systemctl enable nginx
# 检查服务状态
sudo systemctl status nginx
```

然后添加 `raspi.conf` 到 `/etc/nginx/sites-available/`，内容如下：
```nginx title="/etc/nginx/sites-available/raspi.conf"
server {
    listen 80;
    listen [::]:80;
    server_name domain;

    # 静态网站根目录（放你的 index.html）
    root /home/beshar/www;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name domain;

    root /home/beshar/www;
    index index.html;

    # SSL 证书（由 acme.sh 部署）
    ssl_certificate /home/beshar/ssl/fullchain.cer;
    ssl_certificate_key /home/beshar/ssl/domain.key;

    # 推荐的 SSL 安全配置（可选但建议）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 给 python 后端用
    location /api/ {
        proxy_pass http://127.0.0.1:9001/;  # 注意末尾的‘/’; python 端只需要管 9001 端口的路由，不用管 /api/ 前缀
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

接着删除原来的默认配置，并启用新的配置：
```bash
sudo ln -s /etc/nginx/sites-available/raspi.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

> `sites-available` 里是所有可用的配置，而 `sites-enabled` 里是实际启用的配置，里面的文件都是软链接。不要在 `conf.d/` 里放配置文件，这是老版本的做法了。

然后执行 `acme.sh` 的安装证书命令（见上）。此时还是无法访问 nginx 指定的网页的，需要授权：
```sh
sudo chmod 755 /home/beshar
sudo chmod -R 755 /home/beshar/www
```

### 后端服务
在 nginx 的基础上，用 FastAPI 写后端，将请求转换为 GPIO 等操作。由于有了 https，就可以直接传递 token 了。这部分的代码基本由AI完成，需要注意并发（虽然只有我一个人用），没什么好说的。

然后注册为服务，加入开机自启。只要访问 FastAPI 本身提供的 /docs 页面，手机上就能发起请求、完成远程开机了！

具体完成了如下功能：
- `/power?duration=`：按下开机键持续 `duration` 秒（默认2秒）
- `/wol`：发送 WoL 魔术包
- `/ipv6?target=other|self`：获取主机/自己的 ipv6 地址，用于远程连接
- `/shutdown`：给主机发送关机请求
- `/camera`：拍照，用于查看主机是不是亮的

### 备份
完成一切后，要进行备份。因为树莓派的 SD 卡很脆弱，之前无数次重新配置都是因为 SD 卡坏了。主要的代码已经使用git管理了，但是像各种配置等零散文件无法覆盖，还是要备份整个系统。

工具使用 [`pibackup`](https://github.com/RaspberryFpc/pibackup)。它的做法是先克隆整张卡，然后压缩。也就是说，第一步会产生一个和整张 SD 卡一样大的镜像文件（虽然里面有很多空白），所以无法直接在本卡上操作，因此需要将输出放在外接的移动硬盘上。

## 一点感想
别人的全栈：前端+后端
我的全栈：硬件+后端（前端有 FastAPI 暂时够用）
就很……

玩笑归玩笑，确实还是很自豪的！前前后后大概用了五天时间。以后真会用上吗？让我想到大二国庆去北京找一起玩 MC 的同学，那时树莓派上跑着 paperMC 服务器，出发前也是精心调整了树莓派，还做了前端控制面板。结果只有第一天我们玩了服务器，之后、包括回校后的大半年内，服务器基本没人来了…… 这次我去北京之后，真的会用工位这台电脑吗？我表示怀疑，毕竟我人在工位都不怎么用。不过确实学到了很多。

AI神力！省了我不少心思。且不说写 C++ 和 FastAPI 这种我不熟的代码，光在之前做过的事上，已经大幅提高了我的效率。树莓派已经不止10次配置了，之前都是一遍搜索资料一边配置。如今在大模型的帮助下，再也不用费尽心思去翻帖子了（不过近年的资料也少了很多，特别是论坛，估计也都去问AI了），轻松了很多；在大二我就写过校园网接口的脚本，但当时只是简单爬了一下。如今我直接让AI分析整个js，可以看到所有参数的来源；WOL 那里也尝试了好久……在工位弄到零点半。换我自己写魔术包代码还真不一定一次就能跑起来，成功触发第一次真的很重要！

两年前的树莓派代码仓库里还写了“避雷debian12”，伴随着的还有 pytorch装不上、显示器不显示、摄像头看不到、鼠标不跟随 等乱七八糟的问题。没想到如今已经 debian13.5，这些陈年问题都没有了，开箱即用！

以前过的是什么苦日子呜呜呜……