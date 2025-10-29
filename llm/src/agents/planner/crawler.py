#!/usr/bin/env python3
"""
Planner Agent 爬蟲 - 根據用戶食材爬取
爬取愛料理等網站資料，輸出為 JSON
"""

import json
import os
import sys
import time
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from pathlib import Path
import re

@dataclass
class Recipe:
    """食譜資料結構"""
    title: str
    ingredients: List[Dict[str, str]]  # [{"name": "雞肉", "amount": "300g"}]
    steps: List[str]
    cooking_time: Optional[int]  # 分鐘
    servings: Optional[int]
    url: str
    tags: List[str]

# 移除食材搭配資料結構

class RecipeScraper:
    """食譜爬蟲"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.base_url = "https://icook.tw"
        self.delay = 2  # 請求間隔，避免被封
    
    def search_recipes(self, keyword: str, max_pages: int = 2) -> List[str]:
        """搜尋食譜URL"""
        urls = []
        
        for page in range(1, max_pages + 1):
            # 使用正確的搜尋URL
            search_url = f"{self.base_url}/recipes/search?q={keyword}&page={page}"
            
            try:
                response = self.session.get(search_url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 檢查頁面標題確認是搜尋結果頁面
                title = soup.select_one('title')
                if title and keyword in title.get_text():
                    print(f"第 {page} 頁: {title.get_text().strip()}")
                
                # 尋找食譜連結
                recipe_links = soup.select('a[href*="/recipes/"]')
                print(f"第 {page} 頁找到 {len(recipe_links)} 個連結")
                
                for link in recipe_links:
                    href = link.get('href')
                    if href and '/recipes/' in href:
                        # 檢查是否為具體的食譜ID (數字)
                        if re.search(r'/recipes/\d+', href):
                            full_url = href if href.startswith('http') else f"{self.base_url}{href}"
                            if full_url not in urls:
                                urls.append(full_url)
                                print(f"  找到食譜: {full_url}")
                
                print(f"第 {page} 頁有效食譜: {len(urls)} 個")
                time.sleep(self.delay)
                
            except Exception as e:
                print(f"搜尋第 {page} 頁時出錯: {e}")
                continue
        
        print(f"總共找到 {len(urls)} 個有效食譜URL")
        return urls
    
    def scrape_recipe(self, url: str) -> Optional[Recipe]:
        """爬取單個食譜"""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取標題
            title = self._extract_title(soup)
            if not title:
                return None
            
            # 提取食材
            ingredients = self._extract_ingredients(soup)
            
            # 提取步驟
            steps = self._extract_steps(soup)
            
            # 提取烹飪時間
            cooking_time = self._extract_cooking_time(soup)
            
            # 提取份量
            servings = self._extract_servings(soup)
            
            # 提取標籤
            tags = self._extract_tags(soup)
            
            recipe = Recipe(
                title=title,
                ingredients=ingredients,
                steps=steps,
                cooking_time=cooking_time,
                servings=servings,
                url=url,
                tags=tags
            )
            
            return recipe
            
        except Exception as e:
            print(f"爬取食譜失敗 {url}: {e}")
            return None
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """提取標題"""
        title_selectors = [
            'h1.recipe-title',
            'h1',
            '.recipe-title',
            'title'
        ]
        
        for selector in title_selectors:
            elem = soup.select_one(selector)
            if elem:
                title = elem.get_text().strip()
                if title and len(title) > 2:
                    return title
        
        return None
    
    def _extract_ingredients(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """提取食材"""
        ingredients = []
        
        # 愛料理的食材選擇器
        ingredient_selectors = [
            '.ingredient-item',
            '.ingredient-list li',
            '.recipe-ingredients li',
            '.ingredients li',
            '.recipe-ingredient-item'
        ]
        
        for selector in ingredient_selectors:
            items = soup.select(selector)
            if items:
                for item in items:
                    text = item.get_text().strip()
                    if text:
                        # 清理文本，移除多餘的空白和換行
                        text = re.sub(r'\s+', ' ', text)
                        
                        # 嘗試解析食材和份量
                        # 愛料理的格式通常是 "食材名稱\n\n份量" 或 "食材名稱 份量"
                        if '\n\n' in text:
                            parts = text.split('\n\n', 1)
                            ingredients.append({
                                "name": parts[0].strip(),
                                "amount": parts[1].strip()
                            })
                        elif ' ' in text:
                            # 嘗試用空格分割
                            parts = text.split(' ', 1)
                            if len(parts) == 2:
                                ingredients.append({
                                    "name": parts[0].strip(),
                                    "amount": parts[1].strip()
                                })
                            else:
                                ingredients.append({
                                    "name": text,
                                    "amount": ""
                                })
                        else:
                            ingredients.append({
                                "name": text,
                                "amount": ""
                            })
                break
        
        return ingredients
    
    def _extract_steps(self, soup: BeautifulSoup) -> List[str]:
        """提取步驟"""
        steps = []
        
        # 愛料理的步驟選擇器
        step_selectors = [
            'li.recipe-details-step-item',
            '.step-item',
            '.recipe-step',
            '.cooking-step',
            '.steps-list li',
            '.step-list li'
        ]
        
        for selector in step_selectors:
            items = soup.select(selector)
            if items:
                for item in items:
                    text = item.get_text().strip()
                    if text and len(text) > 5:
                        steps.append(text)
                break
        
        return steps
    
    def _extract_cooking_time(self, soup: BeautifulSoup) -> Optional[int]:
        """提取烹飪時間"""
        # 愛料理的特定格式
        time_info = soup.select_one('.time-info.info-block')
        if time_info:
            num_elem = time_info.select_one('.num')
            unit_elem = time_info.select_one('.unit')
            if num_elem and unit_elem:
                try:
                    num = int(num_elem.get_text().strip())
                    unit = unit_elem.get_text().strip()
                    
                    # 處理分鐘
                    if '分' in unit:
                        return num
                    # 處理小時
                    elif '小時' in unit or '時' in unit:
                        return num * 60
                    # 處理秒
                    elif '秒' in unit:
                        return num // 60 if num >= 60 else 1
                except ValueError:
                    pass
        
        # 通用選擇器
        time_selectors = [
            '.cooking-time',
            '.recipe-time',
            '.time',
            '.duration'
        ]
        
        for selector in time_selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text()
                time_val = self._parse_cooking_time(text)
                if time_val:
                    return time_val
        
        return None
    
    def _extract_servings(self, soup: BeautifulSoup) -> Optional[int]:
        """提取份量"""
        # 愛料理的特定格式
        serving_info = soup.select_one('.servings-info.info-block, .portion-info.info-block')
        if serving_info:
            num_elem = serving_info.select_one('.num')
            if num_elem:
                try:
                    return int(num_elem.get_text().strip())
                except ValueError:
                    pass
        
        # 通用選擇器
        serving_selectors = [
            '.servings',
            '.recipe-servings',
            '.portion',
            '.yield'
        ]
        
        for selector in serving_selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text()
                servings = self._parse_servings(text)
                if servings:
                    return servings
        
        return None
    
    def _extract_tags(self, soup: BeautifulSoup) -> List[str]:
        """提取標籤"""
        tags = []
        
        tag_selectors = [
            '.tag',
            '.recipe-tag',
            '.tags a',
            '.category-tag'
        ]
        
        for selector in tag_selectors:
            items = soup.select(selector)
            if items:
                for item in items:
                    tag_text = item.get_text().strip()
                    if tag_text:
                        tags.append(tag_text)
                break
        
        return tags
    
    def _parse_cooking_time(self, text: str) -> Optional[int]:
        """解析烹飪時間文字"""
        # 提取數字
        numbers = re.findall(r'\d+', text)
        if not numbers:
            return None
        
        num = int(numbers[0])
        
        # 判斷單位
        if '小時' in text or '時' in text:
            return num * 60
        elif '分' in text:
            return num
        elif '秒' in text:
            return num // 60 if num >= 60 else 1
        
        return num  # 預設為分鐘
    
    def _parse_servings(self, text: str) -> Optional[int]:
        """解析份量文字"""
        numbers = re.findall(r'\d+', text)
        if numbers:
            return int(numbers[0])
        return None
    
# 移除食材搭配相關方法

def save_recipes(recipes: List[Recipe], output_file: str):
    """保存食譜資料"""
    data = {
        "recipes": [],
        "metadata": {
            "total_recipes": len(recipes),
            "created_at": "2025-10-27",
            "source": "愛料理爬蟲"
        }
    }
    
    # 轉換食譜資料
    for recipe in recipes:
        recipe_dict = {
            "title": recipe.title,
            "ingredients": recipe.ingredients,
            "steps": recipe.steps,
            "cooking_time": recipe.cooking_time,
            "servings": recipe.servings,
            "url": recipe.url,
            "tags": recipe.tags
        }
        data["recipes"].append(recipe_dict)
    
    # 保存到檔案
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"已保存 {len(recipes)} 個食譜到 {output_file}")


def main():
    """真正爬取愛料理資料"""
    print("=== 愛料理食譜爬蟲 ===")
    
    # 用戶的食材清單
    user_ingredients = [
        "石斑魚", "洋蔥", "香菇", "茼蒿", "高麗菜", "番茄", "雞蛋", "豆腐", 
        "橄欖", "優格", "味噌", "鮭魚", "九層塔", "雞腿", "泡菜", "豬絞肉", 
        "檸檬", "大腸"
    ]
    
    print(f"開始爬取食材: {user_ingredients}")
    
    scraper = RecipeScraper()
    all_recipes = []
    
    # 爬取個別食材的食譜 - 每個食材爬取第1頁
    for ingredient in user_ingredients:
        print(f"\n爬取 {ingredient} 相關食譜...")
        recipe_urls = scraper.search_recipes(ingredient, max_pages=1)
        
        print(f"找到 {len(recipe_urls)} 個食譜URL")
        
        for i, url in enumerate(recipe_urls[:5]):  # 每個食材最多5個食譜
            print(f"  爬取第 {i+1} 個食譜: {url}")
            recipe = scraper.scrape_recipe(url)
            if recipe:
                all_recipes.append(recipe)
                print(f"    ✅ {recipe.title}")
                print(f"    食材: {[ing['name'] for ing in recipe.ingredients[:3]]}")
                print(f"    時間: {recipe.cooking_time}分鐘")
            else:
                print(f"    ❌ 爬取失敗")
            time.sleep(scraper.delay)
    
    # 保存結果
    output_file = "data/recipes.json"
    save_recipes(all_recipes, output_file)
    
    print(f"\n=== 爬取完成 ===")
    print(f"總共爬取 {len(all_recipes)} 個食譜")
    print(f"結果已保存到 {output_file}")
    
    # 顯示食材覆蓋情況
    covered_ingredients = set()
    for recipe in all_recipes:
        for ingredient in recipe.ingredients:
            ingredient_name = ingredient["name"]
            for user_ingredient in user_ingredients:
                if user_ingredient in ingredient_name or ingredient_name in user_ingredient:
                    covered_ingredients.add(user_ingredient)
    
    print(f"\n=== 食材覆蓋情況 ===")
    print(f"覆蓋的食材: {len(covered_ingredients)}/{len(user_ingredients)} = {len(covered_ingredients)/len(user_ingredients)*100:.1f}%")
    print(f"覆蓋的食材: {sorted(covered_ingredients)}")
    
    missing_ingredients = set(user_ingredients) - covered_ingredients
    if missing_ingredients:
        print(f"未覆蓋的食材: {sorted(missing_ingredients)}")

if __name__ == "__main__":
    main()