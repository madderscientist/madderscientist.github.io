import { getCollection, type CollectionEntry } from "astro:content";
import { POSTS_PER_PAGE } from "../consts.js";

// 对文章进行排序，置顶文章排在前面，其他文章按发布时间降序排列
export async function getSortedPosts(pinnedFirst = true) {
    return (await getCollection("posts")).sort((a, b) => {
        if (pinnedFirst) {
            if (a.data.pinned && !b.data.pinned) return -1;
            else if (!a.data.pinned && b.data.pinned) return 1;
        }
        return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    });
}

// 分页文章列表 序号从1开始
export function paginatePosts(posts: Post[], currentPage: number, pageSize = POSTS_PER_PAGE) {
    const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;

    return {
        currentPage: safeCurrentPage,
        pagePosts: posts.slice(startIndex, startIndex + pageSize),
        totalPages,
    };
}

export type Post = CollectionEntry<'posts'>;