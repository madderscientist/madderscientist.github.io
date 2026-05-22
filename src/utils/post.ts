import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedPosts(pinnedFirst = true) {
    return (await getCollection("posts")).sort((a, b) => {
        if (pinnedFirst) {
            if (a.data.pinned && !b.data.pinned) return -1;
            else if (!a.data.pinned && b.data.pinned) return 1;
        }
        return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    });
}

export type Post = CollectionEntry<'posts'>;