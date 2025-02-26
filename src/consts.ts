// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

// Site title and description
export const SITE_TAB = "Frosti";
export const SITE_TITLE = "Frosti 🧊";
export const SITE_DESCRIPTION = "A blog template";
export const DATE_FORMAT = "ddd MMM DD YYYY";

// User profile information
export const USER_NAME = "toucher";
export const USER_AVATAR = "/profile.webp";

// Server and transition settings
export const SERVER_URL = "https://demo.saroprock.com";
export const TRANSITION_API = true;

// Some informative text on the site
export const infoTest = {
  tag: "Tag: ",
  noTag: "untagged",
  tagPage: "Tag - ",
  noCategory: "uncategorized",
  categoriesPage: "Categories",
  categoryPage: "Category - ",
  link: "Link: ",
  prevPage: "Recent posts",
  nextPage: "Older posts",
};

// Menu items for navigation
export const menuItems = [
  { id: "home", text: "Home", href: "/", svg: "home", target: "_self" }, // Home page
  { id: "about", text: "About", href: "/about", svg: "about", target: "_self" }, // About page
  {
    id: "blog",
    text: "Blogs",
    href: "/blog",
    svg: "blog",
    target: "_self",
    subItems: [
      {
        id: "all",
        text: "All blogs",
        href: "/blog",
        svg: "post",
        target: "_self",
      }, // All blog
      {
        id: "tech",
        text: "Tech blogs",
        href: "/blog/categories/tech",
        svg: "cube",
        target: "_self",
      }, // Technology category
      {
        id: "life",
        text: "Life blogs",
        href: "/blog/categories/life",
        svg: "heart",
        target: "_self",
      }, // Life category
      {
        id: "categories",
        text: "All categories",
        href: "/blog/categories",
        svg: "categories",
        target: "_self",
      }, // All categories
    ],
  }, // Blog page with sub-items
  {
    id: "project",
    text: "project",
    href: "/project",
    svg: "project",
    target: "_self",
  }, // Projects page
  {
    id: "friend",
    text: "friend",
    href: "/friend",
    svg: "friend",
    target: "_self",
  }, // Friends page
  {
    id: "contact",
    text: "Contact",
    href: "mailto:761844639@qq.com", // Contact email
    target: "_blank", // Open in a new tab
    svg: "contact",
  },
];

// Social media and contact icons
export const socialIcons = [
  // {
  //   href: "https://afdian.net/a/saroprock",
  //   ariaLabel: "Support my work",
  //   title: "Support my work",
  //   svg: "support",
  // },
  {
    href: "https://github.com/toucheres",
    ariaLabel: "Github",
    title: "Github",
    svg: "github",
  },
  {
    href: "https://space.bilibili.com/2076069361",
    ariaLabel: "BiliBili",
    title: "BiliBili",
    svg: "bilibili",
  },
  {
    href: "https://qm.qq.com/q/QJh8wxWY2i",
    ariaLabel: "QQ",
    title: "QQ",
    svg: "qq",
  },
  {
    href: "https://www.zhihu.com/people/toucheres",
    ariaLabel: "ZhiHu",
    title: "ZhiHu",
    svg: "zhihu",
  },
  // {
  //   href: "/rss.xml",
  //   ariaLabel: "RSS Feed",
  //   title: "RSS Feed",
  //   svg: "rss",
  // },
];
// Category Information
export const categoriesInfo = [
  { title: "tech", desc: "About tech", target: "_self" },
  { title: "life", desc: "About life", target: "_self" },
];
