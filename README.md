# [蔽夏的博客！](https://madderscientist.netlify.app/)
使用 Astro 构建。自己手写主题。

## 开发
由于 `pagefind` 仅会在 `astro build` 时索引，为了防止组件报错，首先需要执行：
```sh
pnpm build
```

然后再进行 `pnpm dev` 进行热重载开发。

## 部署
考虑到 `github.io` 薛定谔的墙，选择部署在 `netlify` 上。