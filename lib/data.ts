export interface Post {
  id: number;
  title: string;
  excerpt?: string;
  image: string;
  category: string;
  categoryColor?: string;
  date: string;
  author?: string;
  hasVideo?: boolean;
  videoId?: string;
}

export const trendingPosts = [
  "Bobby Brown Autopsy Reveals He Died From Alcohol, Cocaine And Fentanyl His Death",
  "Winston Churchill And The Union Jack Should Make Us Feel Warm And Gooey Inside",
  "Teacher Suspended For Showing Prophet Muhammad Cartoon 'Defends Free Speech.",
  "Boris Johnson Tells Brits Lockdown Easing Will Go Ahead On Schedule And Vows",
  "How The Seychelles Is Racing To Become The World\u2019S Safest Destination In The World",
  "When Can We Go On Vacation Again? This Is What Experts Say About The Future",
  "Use These Travel Credit Cards To Plan A Post-Pandemic Trip In 2021 With Family",
  "The Purpose Is Share Strategies And Insights For Promoting A Sustainable Future Through Marketing.",
  "How Travelers Help To Protect The Outer Islands Of The Seychelles In North",
  "The Destinations Around The World Open To Travelers Vaccinated Against Covid-19",
];

export const sliderPosts: Post[] = [
  {
    id: 1,
    title: "Bobby Brown Autopsy Reveals He Died From Alcohol,\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/tech12-scaled-1-1200x780.jpg",
    category: "Entertainment",
    date: "March 31, 2021",
  },
  {
    id: 2,
    title: "Winston Churchill And The Union Jack Should Make\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/Business11-1200x780.jpg",
    category: "Business",
    date: "March 31, 2021",
  },
  {
    id: 3,
    title: "Teacher Suspended For Showing Prophet Muhammad Cartoon 'Defends\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/47-1200x780.png",
    category: "Business",
    date: "March 31, 2021",
  },
  {
    id: 4,
    title: "Boris Johnson Tells Brits Lockdown Easing Will Go\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/meeting6-1200x780.jpg",
    category: "Business",
    date: "March 31, 2021",
  },
  {
    id: 5,
    title: "How The Seychelles Is Racing To Become The\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/nature5-scaled-2-1200x780.jpg",
    category: "Travel",
    date: "March 31, 2021",
  },
  {
    id: 6,
    title: "When Can We Go On Vacation Again? This\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/nature3-scaled-1-1200x780.jpg",
    category: "Travel",
    date: "March 31, 2021",
  },
  {
    id: 7,
    title: "Why It\u2019S Easier To Succeed With Cricket Match\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/51-1200x780.png",
    category: "Sports",
    date: "March 31, 2021",
  },
  {
    id: 8,
    title: "Seven Struggles Only People Love Football Industry Will\u2026",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the",
    image: "/images/uploads/2021/03/52-1200x780.png",
    category: "Sports",
    date: "March 31, 2021",
  },
];

export const galleryPosts: Post[] = [
  {
    id: 10,
    title: "Winston Churchill And The Union Jack Should Make",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2021/03/Business11.jpg",
    category: "Business",
    date: "March 31, 2021",
  },
  {
    id: 11,
    title: "Teacher Suspended For Showing Prophet Muhammad Cartoon 'Defends",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2021/03/47.png",
    category: "Business",
    date: "March 31, 2021",
  },
  {
    id: 12,
    title: "Boris Johnson Tells Brits Lockdown Easing Will Go",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2021/03/meeting6.jpg",
    category: "Business",
    date: "March 31, 2021",
  },
  {
    id: 13,
    title: "The Purpose Is Share Strategies And Insights For",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2020/06/slider_post.jpg",
    category: "Business",
    date: "June 14, 2020",
  },
  {
    id: 14,
    title: "Asda Is Set To Launch Its First-Ever Loyalty",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2020/06/69.png",
    category: "Finance",
    date: "June 14, 2020",
    hasVideo: true,
    videoId: "ldwdj3Hzdxo",
  },
  {
    id: 15,
    title: "Inflation Slows In February Amid Falling Clothes Prices",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2020/06/67.png",
    category: "Finance",
    date: "June 14, 2020",
    hasVideo: true,
    videoId: "ldwdj3Hzdxo",
  },
  {
    id: 16,
    title: "East Bengal And Kerala Blasters Have Most Number",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2020/06/t6-1200x780.jpg",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
    videoId: "ldwdj3Hzdxo",
  },
  {
    id: 17,
    title: "How Unpaid Debts Sold Could End Costing You",
    excerpt: "Entilators will be taken from certain New York hospitals and redistributed to the worst-hit parts of the state",
    image: "/images/uploads/2020/06/48.png",
    category: "Finance",
    date: "June 14, 2020",
    hasVideo: true,
    videoId: "ldwdj3Hzdxo",
  },
];

export const latestPosts: Post[] = [
  {
    id: 20,
    title: "Inflation Slows In February Amid Falling Clothes Prices And Rising Fuel Costs Rise Again",
    excerpt: "",
    image: "/images/uploads/2020/06/67-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 21,
    title: "How Unpaid Debts Sold Could End Costing You Hundreds Of Pounds More",
    excerpt: "",
    image: "/images/uploads/2020/06/48-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 22,
    title: "Greene King Now Taking Bookings For Tables In Pub Its 442 Pub Gardens \u2013 How To Book",
    excerpt: "",
    image: "/images/uploads/2020/06/B2-80x70.jpg",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 23,
    title: "Keep Your Vacuum Cleaner On Track With Expert Tips To Prolong Its Long Life Journey",
    excerpt: "",
    image: "/images/uploads/2020/06/6-1-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 24,
    title: "Boost Your Lockdown Privacy Without Breaking The Bank With Our Top Tips.",
    excerpt: "",
    image: "/images/uploads/2020/06/8-1-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
];

export const popularPosts: Post[] = [
  {
    id: 30,
    title: "How The Seychelles Is Racing To Become The World'S Safest Destination",
    excerpt: "",
    image: "/images/uploads/2020/06/category2-1.jpg",
    category: "Travel",
    date: "June 14, 2020",
  },
  {
    id: 31,
    title: "When Can We Go On Vacation Again? This Is What Experts Say",
    excerpt: "",
    image: "/images/uploads/2020/06/category3-1.jpg",
    category: "Travel",
    date: "June 14, 2020",
  },
  {
    id: 32,
    title: "Why It's Easier To Succeed With Cricket Match Than You Might Think",
    excerpt: "",
    image: "/images/uploads/2020/06/category41-1.jpg",
    category: "Sports",
    date: "June 14, 2020",
  },
  {
    id: 33,
    title: "Seven Struggles Only People Love Football Industry Will Understand",
    excerpt: "",
    image: "/images/uploads/2020/06/category5.jpg",
    category: "Sports",
    date: "June 14, 2020",
  },
  {
    id: 34,
    title: "With Series On The Line, Deciding England Set Up To Be Fitting Tour Finale",
    excerpt: "",
    image: "/images/uploads/2020/06/category6-1.jpg",
    category: "Sports",
    date: "June 14, 2020",
  },
];

export const trendingTabPosts: Post[] = [
  {
    id: 40,
    title: "Asda Is Set To Launch Its First-Ever Loyalty Card Scheme Giving Shoppers Money Off Groceries",
    excerpt: "",
    image: "/images/uploads/2020/06/69-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 41,
    title: "Inflation Slows In February Amid Falling Clothes Prices And Rising Fuel Costs Rise Again",
    excerpt: "",
    image: "/images/uploads/2020/06/67-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 42,
    title: "How Unpaid Debts Sold Could End Costing You Hundreds Of Pounds More",
    excerpt: "",
    image: "/images/uploads/2020/06/48-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 43,
    title: "Greene King Now Taking Bookings For Tables In Pub Its 442 Pub Gardens \u2013 How To Book",
    excerpt: "",
    image: "/images/uploads/2020/06/B2-80x70.jpg",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 44,
    title: "Keep Your Vacuum Cleaner On Track With Expert Tips To Prolong Its Long Life Journey",
    excerpt: "",
    image: "/images/uploads/2020/06/6-1-80x70.png",
    category: "Finance",
    date: "June 14, 2020",
  },
];

export const featurePosts: Post[] = [
  {
    id: 50,
    title: "Best iphone 11 and 11 pro cases for 2020",
    excerpt: "",
    image: "/images/uploads/2020/06/15.png",
    category: "Business",
    date: "June 14, 2020",
  },
  {
    id: 51,
    title: "Emirates Palace Spends A Hefty Sum For Ultra Luxury Car",
    excerpt: "",
    image: "/images/uploads/2020/06/16.png",
    category: "Travel",
    date: "June 14, 2020",
  },
  {
    id: 52,
    title: "East Bengal And Kerala Blasters Have Most Number Of Foreign Players",
    excerpt: "",
    image: "/images/uploads/2020/06/t6-1200x780.jpg",
    category: "Sports",
    date: "June 14, 2020",
  },
  {
    id: 53,
    title: "Mbappe Said I Showed Off Too Much, But Now I Show Off At Right Moment",
    excerpt: "",
    image: "/images/uploads/2020/06/t7-1200x780.jpg",
    category: "Sports",
    date: "June 14, 2020",
  },
  {
    id: 54,
    title: "Willian Says Arsenal Struggles Were The Most Frustrating Of Career",
    excerpt: "",
    image: "/images/uploads/2020/06/3-1-1200x780.png",
    category: "Sports",
    date: "June 14, 2020",
  },
  {
    id: 55,
    title: "Harris Gives Fiery Response On Gun Reform After Backlash",
    excerpt: "",
    image: "/images/uploads/2020/06/46.png",
    category: "Business",
    date: "June 14, 2020",
  },
  {
    id: 56,
    title: "Improve Your Mood By Saving Money This International Happiness Day",
    excerpt: "",
    image: "/images/uploads/2020/06/49.png",
    category: "Finance",
    date: "June 14, 2020",
  },
  {
    id: 57,
    title: "Boost Your Lockdown Privacy Without Breaking The Bank",
    excerpt: "",
    image: "/images/uploads/2020/06/67.png",
    category: "Finance",
    date: "June 14, 2020",
  },
];

export const technologyPosts: Post[] = [
  {
    id: 60,
    title: "Keep Your Vacuum Cleaner On Track With Expert Tips",
    excerpt: "",
    image: "/images/uploads/2020/06/6-1.png",
    category: "Technology",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 61,
    title: "Improve Your Mood By Saving Money This International Day",
    excerpt: "",
    image: "/images/uploads/2020/06/8-1.png",
    category: "Technology",
    date: "June 14, 2020",
    hasVideo: true,
  },
];

export const technologyListPosts: Post[] = [
  {
    id: 65,
    title: "Keep Your Vacuum Cleaner On Track With Expert Tips To Prolong Its Long Life Journey",
    excerpt: "",
    image: "/images/uploads/2020/06/6-1-80x70.png",
    category: "Technology",
    date: "June 14, 2020",
  },
  {
    id: 66,
    title: "Improve Your Mood By Saving Money This International Happiness Day",
    excerpt: "",
    image: "/images/uploads/2020/06/8-1-80x70.png",
    category: "Technology",
    date: "June 14, 2020",
  },
  {
    id: 67,
    title: "Greene King Now Taking Bookings For Tables In Pub Its 442 Pub Gardens",
    excerpt: "",
    image: "/images/uploads/2020/06/B2-80x70.jpg",
    category: "Technology",
    date: "June 14, 2020",
  },
  {
    id: 68,
    title: "Boris Johnson Tells Brits Lockdown Easing Will Go Ahead On Schedule",
    excerpt: "",
    image: "/images/uploads/2021/03/meeting6-80x70.jpg",
    category: "Technology",
    date: "June 14, 2020",
  },
];

export const socialCounters = [
  { platform: "Facebook", icon: "fab fa-facebook-f", count: "34,520", label: "Fans", bgClass: "fb-bg" },
  { platform: "Twitter", icon: "fab fa-twitter", count: "34,520", label: "Followers", bgClass: "tw-bg" },
  { platform: "YouTube", icon: "fab fa-youtube", count: "20,000", label: "Subscriber", bgClass: "yt-bg" },
  { platform: "Dribbble", icon: "fab fa-dribbble", count: "1,023", label: "Followers", bgClass: "dr-bg" },
  { platform: "Instagram", icon: "fab fa-instagram", count: "78,596", label: "Follower", bgClass: "ig-bg" },
  { platform: "Vine", icon: "fab fa-vine", count: "54,857", label: "Follower", bgClass: "vi-bg" },
];

export const mostViewPosts: Post[] = [
  {
    id: 70,
    title: "Best iphone 11 and 11 pro cases for 2020",
    excerpt: "",
    image: "/images/uploads/2020/06/15-150x150.png",
    category: "Business",
    date: "June 14, 2020",
  },
  {
    id: 71,
    title: "Emirates Palace Spends A Hefty Sum For Ultra Luxury",
    excerpt: "",
    image: "/images/uploads/2020/06/16-150x150.png",
    category: "Business",
    date: "June 14, 2020",
  },
  {
    id: 72,
    title: "East Bengal And Kerala Blasters Have Most Number",
    excerpt: "",
    image: "/images/uploads/2020/06/49-150x150.png",
    category: "Business",
    date: "June 14, 2020",
  },
  {
    id: 73,
    title: "Mbappe Said I Showed Off Too Much",
    excerpt: "",
    image: "/images/uploads/2020/06/67-150x150.png",
    category: "Business",
    date: "June 14, 2020",
  },
  {
    id: 74,
    title: "Willian Says Arsenal Struggles Were The Most",
    excerpt: "",
    image: "/images/uploads/2020/06/t7-1200x780.jpg",
    category: "Travel",
    date: "June 14, 2020",
  },
  {
    id: 75,
    title: "Harris Gives Fiery Response On Gun Reform",
    excerpt: "",
    image: "/images/uploads/2020/06/B2.jpg",
    category: "Travel",
    date: "June 14, 2020",
  },
  {
    id: 76,
    title: "Improve Your Mood By Saving Money This Day",
    excerpt: "",
    image: "/images/uploads/2020/06/slider_post-80x70.jpg",
    category: "Travel",
    date: "June 14, 2020",
  },
  {
    id: 77,
    title: "Boost Your Lockdown Privacy Without Breaking",
    excerpt: "",
    image: "/images/uploads/2020/06/technology__4-2-80x70.jpg",
    category: "Sports",
    date: "June 14, 2020",
  },
  {
    id: 78,
    title: "How The Seychelles Is Racing To Become",
    excerpt: "",
    image: "/images/uploads/2020/06/category2-1.jpg",
    category: "Sports",
    date: "June 14, 2020",
  },
];

export const videoPosts: Post[] = [
  {
    id: 80,
    title: "East Bengal And Kerala Blasters Have Most Number Of Foreign Players",
    excerpt: "",
    image: "/images/uploads/2020/06/t6-1200x780.jpg",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 81,
    title: "Mbappe Said I Showed Off Too Much, But Now I Show Off At Right Moment",
    excerpt: "",
    image: "/images/uploads/2020/06/t7-1200x780.jpg",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 82,
    title: "Willian Says Arsenal Struggles Were The Most Frustrating Of Career",
    excerpt: "",
    image: "/images/uploads/2020/06/3-1-1200x780.png",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 83,
    title: "Remember The Keeper From Australia Who Saved Everything",
    excerpt: "",
    image: "/images/uploads/2020/06/58-1200x780.png",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 84,
    title: "Jofra Archer To Undergo Surgery On Hand After Freak Injury",
    excerpt: "",
    image: "/images/uploads/2020/06/60-1200x780.png",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 85,
    title: "Former England Captain Karen Smithies Sues Cricket Board",
    excerpt: "",
    image: "/images/uploads/2020/06/61-1200x780.png",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 86,
    title: "With Series On The Line, Deciding England Set Up To Be Fitting",
    excerpt: "",
    image: "/images/uploads/2020/06/70-1200x780.png",
    category: "Sports",
    date: "June 14, 2020",
    hasVideo: true,
  },
];

export const entertainmentPosts: Post[] = [
  {
    id: 90,
    title: "Britney Spears' Attorney Files Petition To Remove Her Father From Conservatorship",
    excerpt: "Britney Spears' attorney filed a petition on Tuesday to remove her father, Jamie Spears, from her conservatorship, intensifying the legal battle over the arrangement that has controlled the pop star's life and finances for 13 years.",
    image: "/images/uploads/2020/06/technology__2-1-1200x780.jpg",
    category: "Entertainment",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 91,
    title: "Jessica Simpson Includes Heartbreaking Entry About Ex Nick Lachey In Paperback",
    excerpt: "Jessica Simpson has opened up about her painful divorce from Nick Lachey in a heartbreaking new entry in the paperback edition of her bestselling memoir Open Book.",
    image: "/images/uploads/2020/06/technology__4-2.jpg",
    category: "Entertainment",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 92,
    title: "Mansion Global Daily: Green Homes Are Growing Home Sales Up In British Columbia",
    excerpt: "Green homes are gaining traction in British Columbia, with eco-friendly features increasingly appealing to buyers in the competitive real estate market.",
    image: "/images/uploads/2020/06/B2.jpg",
    category: "Entertainment",
    date: "June 14, 2020",
    hasVideo: true,
  },
  {
    id: 93,
    title: "Miley Cyrus, Seen Here With Co-Star Emily Osmand Looking Very Different",
    excerpt: "Miley Cyrus and her former Hannah Montana co-star Emily Osmand have been spotted together, showing how much both have changed since their Disney days.",
    image: "/images/uploads/2020/06/46.png",
    category: "Entertainment",
    date: "June 14, 2020",
    hasVideo: true,
  },
];

export const sliderNumberPosts: Post[] = [
  { id: 100, title: "Bobby Brown Autopsy Reveals He Died From Alcohol", image: "/images/uploads/2020/06/15.png", category: "Sports", date: "June 14, 2020" },
  { id: 101, title: "Winston Churchill And The Union Jack Should Make", image: "/images/uploads/2020/06/16.png", category: "Sports", date: "June 14, 2020" },
  { id: 102, title: "Teacher Suspended For Showing Prophet Muhammad Cartoon", image: "/images/uploads/2020/06/48.png", category: "Sports", date: "June 14, 2020" },
  { id: 103, title: "Boris Johnson Tells Brits Lockdown Easing Will Go", image: "/images/uploads/2020/06/46.png", category: "Sports", date: "June 14, 2020" },
  { id: 104, title: "How The Seychelles Is Racing To Become The World", image: "/images/uploads/2020/06/49.png", category: "Sports", date: "June 14, 2020" },
  { id: 105, title: "When Can We Go On Vacation Again? This Is What", image: "/images/uploads/2020/06/67.png", category: "Sports", date: "June 14, 2020" },
  { id: 106, title: "Use These Travel Credit Cards To Plan A Post-Pandemic", image: "/images/uploads/2020/06/69.png", category: "Sports", date: "June 14, 2020" },
  { id: 107, title: "The Purpose Is Share Strategies And Insights For", image: "/images/uploads/2020/06/58-1200x780.png", category: "Sports", date: "June 14, 2020" },
  { id: 108, title: "How Travelers Help To Protect The Outer Islands", image: "/images/uploads/2020/06/60-1200x780.png", category: "Sports", date: "June 14, 2020" },
  { id: 109, title: "The Destinations Around The World Open To Travelers", image: "/images/uploads/2020/06/61-1200x780.png", category: "Sports", date: "June 14, 2020" },
];

export const categories = [
  { name: "Business", image: "/images/uploads/2020/06/category2-1.jpg" },
  { name: "Entertainment", image: "/images/uploads/2020/06/category3-1.jpg" },
  { name: "Finance", image: "/images/uploads/2020/06/category41-1.jpg" },
  { name: "Sports", image: "/images/uploads/2020/06/category5.jpg" },
  { name: "Technology", image: "/images/uploads/2020/06/category6-1.jpg" },
  { name: "Travel", image: "/images/uploads/2020/06/slider_post.jpg" },
];

export const upcomingMatches = [
  { team1: "Germany", team2: "Spain", date: "Tomorrow", time: "M22:30 (CST)", id: 1 },
  { team1: "Portugal", team2: "Spain", date: "Tomorrow", time: "M22:30 (CST)", id: 2 },
  { team1: "Croatia", team2: "England", date: "Tomorrow", time: "M22:30 (CST)", id: 3 },
  { team1: "Croatia", team2: "England", date: "Tomorrow", time: "M22:30 (CST)", id: 4 },
  { team1: "Germany", team2: "England", date: "Tomorrow", time: "M22:30 (CST)", id: 5 },
];

export const footerCategories1 = ["Politics", "Business", "Technology", "Science", "Health", "Sports", "Entertainment"];
export const footerCategories2 = ["Education", "Obituaries", "Corrections", "Today's Paper", "Foods"];
export const footerCategories3 = ["Crossword", "Food", "Automobiles", "Education", "Health", "Magazine", "Weddings"];
export const footerCategories4 = ["Classifieds", "Photographies", "NYT Store", "Journalisms", "Public Editor", "Tools & Services", "My Account"];

export const menuItems = [
  { label: "Home", href: "#", hasDropdown: true },
  { label: "Posts", href: "#", hasDropdown: true },
  { label: "Categores", href: "#", hasDropdown: true },
  { label: "Pages", href: "#", hasDropdown: true },
  { label: "Technology", href: "#technology" },
  { label: "Contact", href: "#" },
  { label: "Mega Menu", href: "#" },
];
