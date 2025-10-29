// utils/ingredientImages.ts

// Normalize text to compare easily
const normalize = (s: string) => (s || "").trim().toLowerCase();

// Name → Image dictionary
export const NAME_IMAGES: Record<string, string> = {
  "番茄": "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1635",
  "紅蘿蔔": "https://images.unsplash.com/photo-1633380110125-f6e685676160?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1742",
  "馬鈴薯": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
  "洋蔥": "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
  "茼蒿":"https://www.roomie.tw/wp-content/uploads/2024/12/88.jpg",

  "雞胸肉": "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
  "雞蛋": "https://images.unsplash.com/photo-1586802990181-a5771596eaea?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
  "牛奶": "https://images.unsplash.com/photo-1634141510639-d691d86f47be?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1528",
  "牛絞肉": "https://www.hucc-coop.tw/images/bg_post3.png",

  "優格":"https://www.daringgourmet.com/wp-content/uploads/2019/10/How-to-Make-Yogurt-4.jpg"
};

// Fallback when we don't recognize the name
export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1495195134817-aeb325a55b65";

// Return the best matching image
export function getIngredientImage(name: string): string {
  const n = normalize(name);

  // Try to match by substring (so "番茄切片" also matches "番茄")
  for (const key of Object.keys(NAME_IMAGES)) {
    if (n.includes(normalize(key))) return NAME_IMAGES[key];
  }

  return FALLBACK_IMAGE;
}