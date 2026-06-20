---
title: Clash Verge 无 GUI 使用
pubDate: 2026-06-20
description: 在linux中无桌面时如何使用 Clash Verge
tags: [技术, Clash, Linux]
---

环境是 `Raspberry Pi OS`，有桌面环境，但是常常不用，因此关闭，并通过 SSH 使用。此时要科学上网，难不成先用 `startx` 开启桌面环境、再在桌面环境中启动 Clash Verge？如果关闭了桌面环境（比如关闭了启动桌面环境的终端），Clash Verge 作为子进程也会被关闭。所以需要一个不依赖 GUI 的启动方式。好在 Clash Verge 本身就是前后端分离的，后端为 `mihomo` 核心，可以绕过 GUI 启动。

该方法的缺点：没法启动 tun 模式和系统代理。

## 启动
先在GUI找到配置文件的路径，我的是 `/home/beshar/.local/share/io.github.clash-verge-rev.clash-verge-rev/clash-verge.yaml`

再找到可执行文件路径：
```sh
$ find /usr -name "*mihomo*" 2>/dev/null
/usr/bin/verge-mihomo-alpha
/usr/bin/verge-mihomo
```

启动【必须指定`-f`! 不然不加载配置文件】：
```sh
sudo -u beshar /usr/bin/verge-mihomo \
  -f /home/beshar/.local/share/io.github.clash-verge-rev.clash-verge-rev/clash-verge.yaml \
  -d /home/beshar/.local/share/io.github.clash-verge-rev.clash-verge-rev/
```

## RESTful API
如何操作呢？通过 RESTful API，可能会看到两种情况：

> [!CAUTION]
> 似乎切换模式不能动态进行，但是切换代理节点是可以的。

### TCP 端口
```raw
INFO[2026-06-20T14:22:21.445217550+08:00] RESTful API listening at: 127.0.0.1:9097
```
`127.0.0.1:9097` 就是后续更改配置要用的端口了。

此时需要 secret，可以在配置文件里找到：
```sh
cat /home/beshar/.local/share/io.github.clash-verge-rev.clash-verge-rev/clash-verge.yaml | grep -i secret
# 示例输出：secret: "set-your-secret"
```

然后再请求：
```sh
SECRET="set-your-secret"
BASE_URL="http://127.0.0.1:9097"

# 查看当前模式
curl -s -H "Authorization: Bearer ${SECRET}" ${BASE_URL}/configs | grep mode
# 切换模式
curl -X PUT -H "Authorization: Bearer ${SECRET}" ${BASE_URL}/configs -d '{"mode":"rule"}'
curl -X PUT -H "Authorization: Bearer ${SECRET}" ${BASE_URL}/configs -d '{"mode":"global"}'
curl -X PUT -H "Authorization: Bearer ${SECRET}" ${BASE_URL}/configs -d '{"mode":"direct"}'

# 查看所有代理组
curl -s -H "Authorization: Bearer ${SECRET}" ${BASE_URL}/proxies
# 查看 xxxxx 组状态
curl -s -H "Authorization: Bearer ${SECRET}" ${BASE_URL}/proxies/xxxxx | grep now
# 切换节点（节点名从上面 /proxies/xxxxx 的 all 列表中获取）
curl -X PUT -H "Authorization: Bearer ${SECRET}" ${BASE_URL}/proxies/xxxxx -d '{"name":"香港01"}'
```

> 可以通过启动时加入 `-ext-ctl 127.0.0.1:9097` 强制开启端口版本的 RESTful API

### Unix Socket
```raw
INFO[2026-06-20T14:56:42.626245863+08:00] RESTful API unix listening at: /tmp/verge/verge-mihomo.sock
```
此时请求这样写（无需认证）：
```sh
SOCKET="/tmp/verge/verge-mihomo.sock"

# 查看当前模式
curl -s --unix-socket ${SOCKET} http://localhost/configs | grep mode
# 切换模式
curl -X PUT --unix-socket ${SOCKET} http://localhost/configs -d '{"mode":"rule"}'
curl -X PUT --unix-socket ${SOCKET} http://localhost/configs -d '{"mode":"global"}'
curl -X PUT --unix-socket ${SOCKET} http://localhost/configs -d '{"mode":"direct"}'

# 查看所有代理组
curl -s --unix-socket ${SOCKET} http://localhost/proxies
# 查看 xxxxx 组状态
curl -s --unix-socket ${SOCKET} http://localhost/proxies/xxxxx | grep now
# 切换节点
curl -X PUT --unix-socket ${SOCKET} http://localhost/proxies/xxxxx -d '{"name":"香港01"}'
```

## 测试
桌面中用 `chromium --proxy-server="http://127.0.0.1:7897"` 启动浏览器测试；bash的配置很常规：
```sh
export http_proxy="http://127.0.0.1:7897" https_proxy="http://127.0.0.1:7897" all_proxy="http://127.0.0.1:7897"
```

## 如果已经开启了 Clash Verge 的 GUI 版本
千万不能再开一个，不然端口冲突。此时切换节点是可以同步到 GUI 上的。但是切换模式的话……似乎只能修改配置后重启mihomo了。