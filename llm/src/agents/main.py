#!/usr/bin/env python3
"""
Menufest Agents 整合主程序
負責調用 Selector Agent 和 Planner Agent，並處理數據流
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# 添加路徑以便導入模組
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(current_dir)
sys.path.insert(0, src_dir)

from agents.selector.agent_react import IngredientSelectorReactAgent, SelectorConstraints, SelectorOutput
from agents.planner.agent import PlannerAgent


class MenufestOrchestrator:
    """Menufest Agents 協調器"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # 初始化 Agents
        self.selector_agent = IngredientSelectorReactAgent()
        self.planner_agent = PlannerAgent()
        
        print("✅ Menufest Orchestrator 初始化完成")
    
    def save_selector_output(self, output: SelectorOutput, filename: str = None) -> str:
        """保存 Selector Agent 輸出到本地 JSON"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"selector_output_{timestamp}.json"
        
        filepath = self.data_dir / filename
        
        # 轉換為字典格式 - 使用新的 schema
        output_dict = {
            "total_days": output.total_days,
            "total_people": output.total_people,
            "start_date": output.start_date,
            "daily_meals": [
                {
                    "date": day_meal.date,
                    "breakfast": [
                        {
                            "dish_name": dish.dish_name,
                            "ingredients": [
                                {
                                    "name": ing.name,
                                    "allocated_quantity": ing.allocated_quantity
                                }
                                for ing in dish.ingredients
                            ]
                        }
                        for dish in day_meal.breakfast
                    ],
                    "lunch": [
                        {
                            "dish_name": dish.dish_name,
                            "ingredients": [
                                {
                                    "name": ing.name,
                                    "allocated_quantity": ing.allocated_quantity
                                }
                                for ing in dish.ingredients
                            ]
                        }
                        for dish in day_meal.lunch
                    ],
                    "dinner": [
                        {
                            "dish_name": dish.dish_name,
                            "ingredients": [
                                {
                                    "name": ing.name,
                                    "allocated_quantity": ing.allocated_quantity
                                }
                                for ing in dish.ingredients
                            ]
                        }
                        for dish in day_meal.dinner
                    ]
                }
                for day_meal in output.daily_meals
            ],
            "generated_at": datetime.now().isoformat()
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output_dict, f, ensure_ascii=False, indent=2)
        
        print(f"📁 Selector 輸出已保存到: {filepath}")
        return str(filepath)
    
    def load_selector_output(self, filepath: str) -> Dict[str, Any]:
        """從本地 JSON 讀取 Selector Agent 輸出"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"📖 已讀取 Selector 輸出: {filepath}")
        return data
    
    def convert_selector_to_planner_format(self, selector_output: SelectorOutput) -> List[Dict[str, Any]]:
        """將 Selector 輸出轉換為 Planner 需要的格式"""
        ingredient_groups = []
        
        # 按天數和餐點順序處理
        for day_idx, day_meal in enumerate(selector_output.daily_meals):
            print(f"📅 處理第 {day_idx + 1} 天 ({day_meal.date})")
            
            # 處理早餐
            if day_meal.breakfast:
                print(f"  🌅 早餐: {len(day_meal.breakfast)} 個菜色")
                for dish_idx, dish in enumerate(day_meal.breakfast):
                    if dish.ingredients:
                        main_ingredient = dish.ingredients[0].name
                        supporting_ingredients = [ing.name for ing in dish.ingredients[1:]]
                        ingredient_groups.append({
                            "main_ingredient": main_ingredient,
                            "supporting_ingredients": supporting_ingredients,
                            "total_amount": f"{selector_output.total_people}人份",
                            "day": day_idx + 1,
                            "meal": "早餐",
                            "dish_name": dish.dish_name
                        })
                        print(f"    - {dish.dish_name}: {main_ingredient} + {supporting_ingredients}")
            
            # 處理午餐
            if day_meal.lunch:
                print(f"  🌞 午餐: {len(day_meal.lunch)} 個菜色")
                for dish_idx, dish in enumerate(day_meal.lunch):
                    if dish.ingredients:
                        main_ingredient = dish.ingredients[0].name
                        supporting_ingredients = [ing.name for ing in dish.ingredients[1:]]
                        ingredient_groups.append({
                            "main_ingredient": main_ingredient,
                            "supporting_ingredients": supporting_ingredients,
                            "total_amount": f"{selector_output.total_people}人份",
                            "day": day_idx + 1,
                            "meal": "午餐",
                            "dish_name": dish.dish_name
                        })
                        print(f"    - {dish.dish_name}: {main_ingredient} + {supporting_ingredients}")
            
            # 處理晚餐
            if day_meal.dinner:
                print(f"  🌙 晚餐: {len(day_meal.dinner)} 個菜色")
                for dish_idx, dish in enumerate(day_meal.dinner):
                    if dish.ingredients:
                        main_ingredient = dish.ingredients[0].name
                        supporting_ingredients = [ing.name for ing in dish.ingredients[1:]]
                        ingredient_groups.append({
                            "main_ingredient": main_ingredient,
                            "supporting_ingredients": supporting_ingredients,
                            "total_amount": f"{selector_output.total_people}人份",
                            "day": day_idx + 1,
                            "meal": "晚餐",
                            "dish_name": dish.dish_name
                        })
                        print(f"    - {dish.dish_name}: {main_ingredient} + {supporting_ingredients}")
        
        print(f"🔄 總共轉換了 {len(ingredient_groups)} 個食材分組")
        return ingredient_groups
    
    def save_planner_output(self, output: Dict[str, Any], filename: str = None) -> str:
        """保存 Planner Agent 輸出到本地 JSON"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"planner_output_{timestamp}.json"
        
        filepath = self.data_dir / filename
        
        # 調試信息
        print(f"🔍 save_planner_output 接收到的 output 類型: {type(output)}")
        print(f"🔍 output 內容: {output}")
        
        # 創建可修改的副本並添加生成時間戳
        try:
            output_copy = dict(output) if output else {}
            output_copy["generated_at"] = datetime.now().isoformat()
        except Exception as e:
            print(f"❌ 創建 output_copy 失敗: {e}")
            output_copy = {"error": str(e), "generated_at": datetime.now().isoformat()}
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output_copy, f, ensure_ascii=False, indent=2)
        
        print(f"📁 Planner 輸出已保存到: {filepath}")
        return str(filepath)
    
    def run_full_pipeline(self, 
                         user_id: str,
                         people: int,
                         days: int,
                         meals: List[str],
                         constraints: SelectorConstraints,
                         planner_preferences: List[str] = None,
                         max_cooking_time: int = 30,
                         max_steps: int = 5,
                         start_date: str = None) -> Dict[str, Any]:
        """運行完整的 Menufest 流程"""
        
        print("🚀 開始 Menufest 完整流程")
        print(f"📋 參數: {people}人, {days}天, 餐點: {meals}")
        
        # Step 1: 調用 Selector Agent
        print("\n=== Step 1: 食材選擇 ===")
        try:
            selector_output = self.selector_agent.run(
                user_id=user_id,
                people=people,
                days=days,
                meals=meals,
                c=constraints,
                start_date=start_date
            )
            
            # 保存 Selector 輸出
            selector_file = self.save_selector_output(selector_output)
            
            if not selector_output.daily_meals:
                return {
                    "success": False,
                    "error": "Selector Agent 無法找到足夠的食材",
                    "selector_output": selector_output.dict(),
                    "planner_output": None
                }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Selector Agent 執行失敗: {str(e)}",
                "selector_output": None,
                "planner_output": None
            }
        
        # Step 2: 轉換格式並調用 Planner Agent
        print("\n=== Step 2: 菜單規劃 ===")
        try:
            # 轉換 Selector 輸出為 Planner 格式
            ingredient_groups = self.convert_selector_to_planner_format(selector_output)
            
            print(f"🔄 轉換後的食材分組: {len(ingredient_groups)} 組")
            for i, group in enumerate(ingredient_groups):
                print(f"  組 {i+1}: {group['main_ingredient']} + {group['supporting_ingredients']}")
            
            # 調用 Planner Agent - 使用新的 IO Schema
            from agents.planner.agent import PlannerRequest, IngredientGroup
            ingredient_group_objects = [IngredientGroup(**group) for group in ingredient_groups]
            planner_request = PlannerRequest(
                ingredient_groups=ingredient_group_objects,
                people=people,
                days=days,
                meals=meals,
                max_cooking_time=max_cooking_time,
                max_steps=max_steps,
                preferences=planner_preferences or ["家常菜"],
                start_date=start_date or datetime.now().strftime("%Y-%m-%d")
            )
            planner_output = self.planner_agent.plan_menu_with_params(planner_request)
            
            # 調試信息
            print(f"🔍 planner_output 類型: {type(planner_output)}")
            print(f"🔍 planner_output 內容: {planner_output}")
            
            # 保存 Planner 輸出
            if planner_output and hasattr(planner_output, 'model_dump'):
                planner_data = planner_output.model_dump()
                print(f"✅ 使用 model_dump() 轉換成功")
            elif planner_output and hasattr(planner_output, 'dict'):
                planner_data = planner_output.dict()
                print(f"✅ 使用 dict() 轉換成功")
            else:
                planner_data = {}
                print(f"❌ 無法轉換 planner_output，使用空字典")
            
            print(f"🔍 planner_data 類型: {type(planner_data)}")
            planner_file = self.save_planner_output(planner_data)
            
            return {
                "success": True,
                "selector_file": selector_file,
                "planner_file": planner_file,
                "selector_output": selector_output.dict(),
                "planner_output": planner_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Planner Agent 執行失敗: {str(e)}",
                "selector_output": selector_output.dict(),
                "planner_output": None
            }
    
    def run_from_selector_file(self,
                              selector_file: str,
                              people: int,
                              days: int,
                              meals: List[str],
                              planner_preferences: List[str] = None,
                              max_cooking_time: int = 30,
                              max_steps: int = 5,
                              start_date: str = None) -> Dict[str, Any]:
        """從現有的 Selector 文件開始運行 Planner"""
        
        print(f"🔄 從 Selector 文件開始: {selector_file}")
        
        try:
            # 讀取 Selector 輸出
            selector_data = self.load_selector_output(selector_file)
            
            # 轉換為 SelectorOutput 對象
            from agents.selector.agent_react import SelectorOutput
            selector_output = SelectorOutput(**selector_data)
            
            # 轉換格式
            ingredient_groups = self.convert_selector_to_planner_format(selector_output)
            
            # 調用 Planner Agent - 使用新的 IO Schema
            from agents.planner.agent import PlannerRequest, IngredientGroup
            ingredient_group_objects = [IngredientGroup(**group) for group in ingredient_groups]
            planner_request = PlannerRequest(
                ingredient_groups=ingredient_group_objects,
                people=people,
                days=days,
                meals=meals,
                max_cooking_time=max_cooking_time,
                max_steps=max_steps,
                preferences=planner_preferences or ["家常菜"],
                start_date=start_date or datetime.now().strftime("%Y-%m-%d")
            )
            planner_output = self.planner_agent.plan_menu_with_params(planner_request)
            
            # 保存 Planner 輸出
            if planner_output and hasattr(planner_output, 'model_dump'):
                planner_data = planner_output.model_dump()
            elif planner_output and hasattr(planner_output, 'dict'):
                planner_data = planner_output.dict()
            else:
                planner_data = {}
            planner_file = self.save_planner_output(planner_data)
            
            return {
                "success": True,
                "selector_file": selector_file,
                "planner_file": planner_file,
                "selector_data": selector_data,
                "planner_output": planner_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"從 Selector 文件運行失敗: {str(e)}",
                "selector_file": selector_file,
                "planner_output": None
            }


def main():
    """主程序入口"""
    print("🍽️ Menufest Agents 整合程序")
    
    # 初始化協調器
    orchestrator = MenufestOrchestrator()
    
    # 測試參數
    user_id = "f9d8631f-d491-4bf8-92c0-69e4bce5f730"
    people = 2
    days = 1
    meals = ["早餐", "午餐", "晚餐"]
    constraints = SelectorConstraints(
        allergies=[],
        exclude_ingredients=[]
    )
    planner_preferences = ["家常菜", "下飯菜"]
    
    print(f"\n📋 測試參數:")
    print(f"  - 用戶ID: {user_id}")
    print(f"  - 人數: {people}")
    print(f"  - 天數: {days}")
    print(f"  - 餐點: {meals}")
    print(f"  - 偏好: {planner_preferences}")
    
    # 運行完整流程
    result = orchestrator.run_full_pipeline(
        user_id=user_id,
        people=people,
        days=days,
        meals=meals,
        constraints=constraints,
        planner_preferences=planner_preferences
    )
    
    # 輸出結果
    print(f"\n🎯 執行結果:")
    if result["success"]:
        print("✅ 成功完成完整流程")
        print(f"📁 Selector 文件: {result['selector_file']}")
        print(f"📁 Planner 文件: {result['planner_file']}")
        
        # 顯示菜單摘要
        if result["planner_output"] and result["planner_output"].get("success"):
            menu_plan = result["planner_output"].get("menu_plan")
            if menu_plan:
                print(f"\n🍽️ 生成的菜單:")
                print(f"  - 開始日期: {menu_plan.get('start_date', 'N/A')}")
                print(f"  - 天數: {menu_plan.get('days', 'N/A')}")
                print(f"  - 人數: {menu_plan.get('people', 'N/A')}")
                print(f"  - 餐點: {menu_plan.get('daytimes', 'N/A')}")
                
                schedule = menu_plan.get("schedule", [])
                for day_schedule in schedule:
                    date = day_schedule.get("date", "N/A")
                    print(f"\n📅 {date}:")
                    for meal_type in ["breakfast", "lunch", "dinner"]:
                        meal_recipes = day_schedule.get(meal_type, [])
                        if meal_recipes:
                            print(f"  {meal_type}:")
                            for recipe in meal_recipes:
                                print(f"    - {recipe.get('recipe_name', 'N/A')}")
    else:
        print("❌ 執行失敗")
        print(f"錯誤: {result['error']}")


if __name__ == "__main__":
    main()
