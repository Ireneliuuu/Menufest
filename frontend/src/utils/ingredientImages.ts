// utils/ingredientImages.ts

// Normalize text to compare easily
const normalize = (s: string) => (s || "").trim().toLowerCase();

// Name → Image dictionary
export const NAME_IMAGES: Record<string, string> = {
  "番茄": "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1635",
  "紅蘿蔔": "https://images.unsplash.com/photo-1633380110125-f6e685676160?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1742",
  "馬鈴薯": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
  "洋蔥": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Onions_in_Peng_Chau.jpg",
  "茼蒿":"https://www.roomie.tw/wp-content/uploads/2024/12/88.jpg",

  "雞胸肉": "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
  "雞蛋": "https://images.unsplash.com/photo-1586802990181-a5771596eaea?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
  "牛奶": "https://images.unsplash.com/photo-1634141510639-d691d86f47be?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1528",
  "牛絞肉": "https://www.hucc-coop.tw/images/bg_post3.png",

  "石斑魚": "https://www.chunfu-food.com/images/product_l_386481.jpg",
  "香菇": "https://www.green-n-safe.com/uploads/images/thumbs/0002306_016%E6%9C%89%E6%A9%9F%E7%94%9F%E9%AE%AE%E9%A6%99%E8%8F%87003.png",
  "高麗菜": "https://doqvf81n9htmm.cloudfront.net/data/crop_article/89687/cabbage.jpg_1140x855.jpg",
  "豆腐": "https://blog.worldgymtaiwan.com/hs-fs/hubfs/%E6%96%87%E7%AB%A0%E5%B0%88%E7%94%A8%E5%9C%96%E7%89%87/%E8%B1%86%E8%85%90%E7%87%9F%E9%A4%8A%E5%83%B9%E5%80%BC%E6%AF%94%E4%B8%80%E6%AF%94!%E7%87%9F%E9%A4%8A%E5%B8%AB%E6%95%99%E4%BD%A03%E9%81%93%E5%A2%9E%E8%82%8C%E6%B8%9B%E8%84%82%E8%B1%86%E8%85%90%E6%96%99%E7%90%86.jpg?width=700&height=467&name=%E8%B1%86%E8%85%90%E7%87%9F%E9%A4%8A%E5%83%B9%E5%80%BC%E6%AF%94%E4%B8%80%E6%AF%94!%E7%87%9F%E9%A4%8A%E5%B8%AB%E6%95%99%E4%BD%A03%E9%81%93%E5%A2%9E%E8%82%8C%E6%B8%9B%E8%84%82%E8%B1%86%E8%85%90%E6%96%99%E7%90%86.jpg",
  "味噌": "https://video.kurashiru.com/production/articles/15938bfc-01ca-493d-b5ba-754fa3ae8cfc/wide_thumbnail_normal.jpg?1702271291",
  "鮭魚": "https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2232",
  "九層塔": "https://www.shinan-tw.com/wp-content/uploads/2021/09/DSC_3017.jpg",
  "雞腿": "https://images.unsplash.com/photo-1708782342351-74f02e9a16c4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1480",
  "泡菜": "https://images.unsplash.com/photo-1708388064278-707e85eaddc0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=988",
  "豬絞肉": "https://uploads-blog.icook.network/2016/05/%E8%B1%AC%E7%98%A6%E7%B5%9E%E8%82%89%E7%B2%97-1.jpg",
  "檸檬": "https://images.unsplash.com/photo-1590502593747-42a996133562?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1035",
  "大腸": "https://img.cloudimg.in/uploads/shops/11845/products/a3/a3d806f92be2c93e44ad6f213585588d.jpg",

  "牛番茄": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=1635",
  "青蔥": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEim9ZhkSWMq0OkxAYeSmJHEN4n7n95Zgx6c0NoHW4hIwYRWNs3pA391fwZEHOZt3GWbqlFL67-WSN46rBNo_pWEijpjTGmtydmGCSEYuHE4bSAVGs0g0I-5g0AXWLLu3rFbQiQASLBD6GE/s640/a100003_100004_1366111716.jpg",
  "蒜頭": "https://images.unsplash.com/photo-1636210589096-a53d5dacd702?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2232",
  "薑": "https://images.unsplash.com/photo-1599940859674-a7fef05b94ae?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
  "蛤蜊": "https://images.unsplash.com/photo-1539124232514-3ad6c6da22a7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
  "鮮奶": "https://images.unsplash.com/photo-1634141510639-d691d86f47be?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1528",
  "奶油": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
  "義大利麵": "https://images.unsplash.com/photo-1648141294660-78c4e41f99a3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1674",
  "米": "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
  "豆漿": "https://images.unsplash.com/photo-1555465083-a845797ef750?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1064",
  "小黃瓜": "https://images.unsplash.com/photo-1589621316382-008455b857cd?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
  "菠菜": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1035",
  "玉米": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
  "紅椒": "https://images.unsplash.com/photo-1546860255-95536c19724e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1008",
  "可可粉": "https://img.yec.tw/zp/MerchandiseImages/D251597752-SP-10337346.jpg",
  "麵粉": "https://images.unsplash.com/photo-1627735483792-233bf632619b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2085",
  "燕麥片": "https://images.unsplash.com/photo-1614373532018-92a75430a0da?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
  "起司片": "https://images.unsplash.com/photo-1683314573422-649a3c6ad784?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",

  "優格":"https://www.daringgourmet.com/wp-content/uploads/2019/10/How-to-Make-Yogurt-4.jpg",
  "橄欖":"https://i.ntdtv.com/assets/uploads/2022/01/2022-01-19_142836.jpg",
  "貢丸": "https://cdn-next.cybassets.com/media/W1siZiIsIjEyNzkwL3Byb2R1Y3RzLzUwNzgwMzI0LzE3MzA0Mzg1NDNfZTA3MWM0YjVkZjRkYTgyOGFjNTIucG5nIl0sWyJwIiwidGh1bWIiLCI2MDB4NjAwIl1d.png?sha=b00c069edbfdcf8e",
  "豆皮": "https://img.leezen.com.tw/upload/images/6060101531P3.jpg",
  "空心菜": "https://thisvage.com/wp-content/uploads/2025/01/%E7%A9%BA%E5%BF%83%E8%8F%9C-e1744474003740-600x564.png"
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