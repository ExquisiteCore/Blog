export default defineSitemapEventHandler(async () => {
  interface Post {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: null | string;
    Title: string;
    Content: string;
    Preview: string;
    Tags: null | string[];
  }

  interface SitemapData {
    data: Post[];
    message: string;
  }
  const list: SitemapData = await $fetch('https://server.exquisitecore.xyz:56394/api/post/list')

  return list.data.map(post => {
    return {
      loc: '/blog/article?seq=' + post.ID,
    }
  })
  // return [
  //   {
  //     loc: '/blog/article?seq=5',
  //   }
  // ]
})