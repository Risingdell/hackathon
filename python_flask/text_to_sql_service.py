# """
# NL2SQL FastAPI Service
# Converts natural language queries to SQL using either mock mode or T5 transformer model.
# """
# from typing import Optional
# import asyncio
# import re

# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel

# # Import advanced SQL generator
# try:
#     from sql_generator_advanced import AdvancedSQLGenerator
#     ADVANCED_GENERATOR_AVAILABLE = True
# except ImportError:
#     ADVANCED_GENERATOR_AVAILABLE = False

# app = FastAPI(title="NL2SQL Service")

# # Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # In production, specify exact origins
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Set True to test without loading the huge model
# # USE_MOCK = True
# USE_MOCK = False


# # Use advanced generator (Phase 2 features)
# USE_ADVANCED_GENERATOR = True

# # Global variables for model (loaded asynchronously)
# tokenizer = None
# model = None
# model_loading = False
# model_loaded = False

# # Initialize advanced generator if available
# advanced_generator = AdvancedSQLGenerator() if ADVANCED_GENERATOR_AVAILABLE and USE_ADVANCED_GENERATOR else None

# # Request body schema
# class NLQuery(BaseModel):
#     """Request model for natural language queries"""
#     nl_query: str
#     schema: Optional[str] = ""  # Optional table info for complex queries

# # Root endpoint to test if server is running
# @app.get("/")
# async def root():
#     """Root endpoint - returns service status"""
#     return {
#         "message": "NL2SQL Service is running!",
#         "status": "ready",
#         "mock_mode": USE_MOCK,
#         "advanced_generator": USE_ADVANCED_GENERATOR and ADVANCED_GENERATOR_AVAILABLE,
#         "model_loaded": model_loaded if not USE_MOCK else "N/A"
#     }

# # Health check endpoint
# @app.get("/health")
# async def health():
#     """Health check endpoint - returns service and model status"""
#     return {
#         "status": "healthy",
#         "mock_mode": USE_MOCK,
#         "model_status": "loaded" if model_loaded else ("loading" if model_loading else "not_loaded")
#     }

# def generate_mock_sql(nl_query: str) -> str:
#     """
#     Enhanced mock SQL generator with dynamic filter extraction and optimization
#     Supports intelligent column mapping and multiple conditions
#     """
#     query_lower = nl_query.lower()

#     # Database schema mapping for intelligent column selection
#     schema = {
#         'customers': {
#             'columns': ['customer_id', 'name', 'email', 'city', 'created_at'],
#             'aliases': {
#                 'customer': 'customers',
#                 'client': 'customers',
#                 'buyer': 'customers'
#             }
#         },
#         'products': {
#             'columns': ['product_id', 'name', 'category', 'price', 'stock'],
#             'aliases': {
#                 'product': 'products',
#                 'item': 'products',
#                 'goods': 'products'
#             }
#         },
#         'orders': {
#             'columns': ['order_id', 'customer_id', 'product_id', 'quantity', 'order_date'],
#             'aliases': {
#                 'order': 'orders',
#                 'purchase': 'orders',
#                 'sale': 'orders'
#             }
#         }
#     }

#     # Determine the primary table from the query
#     table_name = _detect_table(query_lower, schema)

#     # Extract dynamic filters
#     filters = _extract_filters(query_lower, table_name, schema)

#     # Determine if specific columns are requested
#     requested_columns = _extract_columns(query_lower, table_name, schema)

#     # Check for aggregation functions
#     aggregation = _detect_aggregation(query_lower)

#     # Check for JOIN requirements
#     needs_join = _detect_join_requirement(query_lower)

#     # Check for sorting
#     sort_clause = _detect_sorting(query_lower)

#     # Check for limit
#     limit_clause = _detect_limit(query_lower)

#     # Build the optimized SQL query
#     sql = _build_sql_query(
#         table_name=table_name,
#         columns=requested_columns,
#         filters=filters,
#         aggregation=aggregation,
#         needs_join=needs_join,
#         sort_clause=sort_clause,
#         limit_clause=limit_clause,
#         schema=schema
#     )

#     return sql


# def _detect_table(query: str, schema: dict) -> str:
#     """Detect which table the query is about"""
#     # Count mentions of each table
#     table_scores = {}

#     for table, info in schema.items():
#         score = 0
#         # Check direct table name
#         if table in query or table[:-1] in query:  # singular form
#             score += 10
#         # Check aliases
#         for alias in info['aliases'].keys():
#             if alias in query:
#                 score += 5
#         table_scores[table] = score

#     # Return table with highest score, default to customers
#     if max(table_scores.values()) > 0:
#         return max(table_scores, key=table_scores.get)
#     return 'customers'


# def _extract_filters(query: str, table: str, schema: dict) -> list:
#     """Extract dynamic filters from the query"""
#     filters = []

#     # City filter (for customers)
#     if table == 'customers':
#         city_patterns = [
#             r'\b(from|in|at|located in)\s+["\']?([a-z\s]+?)["\']?(?:\s|$|,)',
#             r'\bcity\s*(?:is|=|:)?\s*["\']?([a-z\s]+?)["\']?(?:\s|$|,)',
#             r'\b(new york|chicago|boston|san francisco|los angeles|seattle|miami)\b'
#         ]
#         # for pattern in city_patterns:
#         #     match = re.search(pattern, query)
#         #     if match:
#         #         city = match.group(2) if len(match.groups()) > 1 else match.group(1)
#         #         city = city.strip().title()
#         #         filters.append(f"city = '{city}'")
#         #         break
#         for pattern in city_patterns:
#             match = re.search(pattern, query, re.IGNORECASE)
#             if match:
#                 city = next((g for g in match.groups() if g), None)
#                 if city:
#                     city = city.strip().title()
#                     filters.append(f"city = '{city}'")
#                     break


#         # Email filter
#         email_match = re.search(r'\bemail\s*(?:is|=|like|contains)?\s*["\']?([a-z0-9@.]+)["\']?', query)
#         if email_match:
#             email = email_match.group(1).strip()
#             if '@' in email:
#                 filters.append(f"email = '{email}'")
#             else:
#                 filters.append(f"email LIKE '%{email}%'")

#         # Name filter
#         name_match = re.search(r'\bname\s*(?:is|=|like|contains)?\s*["\']?([a-z\s]+?)["\']?(?:\s+(?:from|in|with|and)|$)', query)
#         if name_match:
#             name = name_match.group(1).strip().title()
#             filters.append(f"name LIKE '%{name}%'")

#     # Category filter (for products)
#     if table == 'products':
#         category_patterns = [
#             r'\b(electronics|furniture|accessories|clothing|food|books|toys)\b',
#             r'\bcategory\s*(?:is|=|:)?\s*["\']?([a-z\s]+?)["\']?(?:\s|$)',
#             r'\b(in|from|of)\s+(?:the\s+)?["\']?([a-z\s]+?)["\']?\s+category',
#         ]
#         for pattern in category_patterns:
#             match = re.search(pattern, query)
#             if match:
#                 category = match.group(1) if len(match.groups()) == 1 else match.group(2)
#                 category = category.strip().title()
#                 filters.append(f"category = '{category}'")
#                 break

#         # Price filters
#         price_operators = {
#             r'\bprice\s*(?:greater than|more than|above|>)\s*(\d+(?:\.\d+)?)': '>',
#             r'\bprice\s*(?:less than|below|under|<)\s*(\d+(?:\.\d+)?)': '<',
#             r'\bprice\s*(?:equals?|is|=)\s*(\d+(?:\.\d+)?)': '=',
#             r'\bprice\s*(?:at least|minimum)\s*(\d+(?:\.\d+)?)': '>=',
#             r'\bprice\s*(?:at most|maximum)\s*(\d+(?:\.\d+)?)': '<=',
#         }
#         for pattern, operator in price_operators.items():
#             match = re.search(pattern, query)
#             if match:
#                 price = match.group(1)
#                 filters.append(f"price {operator} {price}")
#                 break

#         # Price range
#         range_match = re.search(r'\bprice\s+between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)', query)
#         if range_match:
#             min_price, max_price = range_match.groups()
#             filters.append(f"price BETWEEN {min_price} AND {max_price}")

#         # Stock filter
#         if 'in stock' in query or 'available' in query:
#             filters.append("stock > 0")
#         elif 'out of stock' in query or 'unavailable' in query:
#             filters.append("stock = 0")

#         # Name/product name filter
#         product_name_match = re.search(r'\b(?:product|item)\s+(?:named|called)\s+["\']?([a-z\s]+?)["\']?(?:\s|$)', query)
#         if product_name_match:
#             name = product_name_match.group(1).strip().title()
#             filters.append(f"name LIKE '%{name}%'")

#     # Order filters
#     if table == 'orders':
#         # Date filters
#         date_patterns = {
#             r'\b(?:on|at|date)\s+["\']?(\d{4}-\d{2}-\d{2})["\']?': '=',
#             r'\b(?:after|since)\s+["\']?(\d{4}-\d{2}-\d{2})["\']?': '>',
#             r'\b(?:before|until)\s+["\']?(\d{4}-\d{2}-\d{2})["\']?': '<',
#         }
#         for pattern, operator in date_patterns.items():
#             match = re.search(pattern, query)
#             if match:
#                 date = match.group(1)
#                 filters.append(f"order_date {operator} '{date}'")
#                 break

#         # Quantity filter
#         quantity_match = re.search(r'\bquantity\s*(?:greater than|more than|>)\s*(\d+)', query)
#         if quantity_match:
#             qty = quantity_match.group(1)
#             filters.append(f"quantity > {qty}")

#     return filters


# def _extract_columns(query: str, table: str, schema: dict) -> list:
#     """Determine which columns to SELECT based on query"""
#     # Keywords indicating specific column requests
#     specific_keywords = {
#         'name': ['name'],
#         'email': ['email'],
#         'city': ['city'],
#         'price': ['price'],
#         'category': ['category'],
#         'stock': ['stock'],
#         'quantity': ['quantity'],
#         'date': ['order_date', 'created_at'],
#         'id': ['customer_id', 'product_id', 'order_id']
#     }

#     requested = []

#     # Check for "only" or "just" keywords
#     if re.search(r'\b(only|just)\b', query):
#         for keyword, cols in specific_keywords.items():
#             if keyword in query:
#                 for col in cols:
#                     if col in schema[table]['columns']:
#                         requested.append(col)

#     # If specific columns found, return them; otherwise return all
#     return requested if requested else ['*']


# def _detect_aggregation(query: str) -> dict:
#     """Detect aggregation functions"""
#     agg = {'function': None, 'column': None, 'alias': None}

#     # COUNT
#     if re.search(r'\b(count|how many|number of|total number)\b', query):
#         agg['function'] = 'COUNT'
#         agg['column'] = '*'
#         agg['alias'] = 'total_count'

#         if 'customer' in query:
#             agg['alias'] = 'total_customers'
#         elif 'product' in query:
#             agg['alias'] = 'total_products'
#         elif 'order' in query:
#             agg['alias'] = 'total_orders'

#     # SUM
#     elif re.search(r'\b(sum|total|sum of)\b', query):
#         agg['function'] = 'SUM'
#         if 'price' in query or 'revenue' in query or 'sales' in query:
#             agg['column'] = 'price'
#             agg['alias'] = 'total_amount'
#         elif 'quantity' in query:
#             agg['column'] = 'quantity'
#             agg['alias'] = 'total_quantity'

#     # AVG
#     elif re.search(r'\b(average|avg|mean)\b', query):
#         agg['function'] = 'AVG'
#         if 'price' in query:
#             agg['column'] = 'price'
#             agg['alias'] = 'average_price'

#     # MAX
#     elif re.search(r'\b(max|maximum|highest|most expensive)\b', query):
#         agg['function'] = 'MAX'
#         if 'price' in query:
#             agg['column'] = 'price'
#             agg['alias'] = 'max_price'

#     # MIN
#     elif re.search(r'\b(min|minimum|lowest|cheapest)\b', query):
#         agg['function'] = 'MIN'
#         if 'price' in query:
#             agg['column'] = 'price'
#             agg['alias'] = 'min_price'

#     return agg if agg['function'] else None


# def _detect_join_requirement(query: str) -> dict:
#     """Detect if query needs JOIN operations"""
#     joins = None

#     # Customer + Orders
#     if ('customer' in query and 'order' in query) or \
#        ('buyer' in query and 'purchase' in query):
#         joins = {
#             'type': 'customer_orders',
#             'tables': ['customers', 'orders'],
#             'condition': 'customers.customer_id = orders.customer_id'
#         }

#     # Product + Orders
#     if ('product' in query and 'order' in query) or \
#        ('item' in query and 'purchase' in query):
#         joins = {
#             'type': 'product_orders',
#             'tables': ['products', 'orders'],
#             'condition': 'products.product_id = orders.product_id'
#         }

#     # All three tables
#     if ('customer' in query and 'product' in query and 'order' in query) or \
#        'purchase history' in query or 'order details' in query:
#         joins = {
#             'type': 'full_order_details',
#             'tables': ['customers', 'orders', 'products'],
#             'conditions': [
#                 'customers.customer_id = orders.customer_id',
#                 'products.product_id = orders.product_id'
#             ]
#         }

#     return joins


# def _detect_sorting(query: str) -> str:
#     """Detect ORDER BY requirements"""
#     # Ascending
#     if re.search(r'\b(sort|order)\b.*\b(asc|ascending|lowest|alphabetical)\b', query):
#         if 'price' in query:
#             return 'ORDER BY price ASC'
#         elif 'name' in query:
#             return 'ORDER BY name ASC'
#         elif 'date' in query:
#             return 'ORDER BY order_date ASC'

#     # Descending
#     if re.search(r'\b(sort|order)\b.*\b(desc|descending|highest|reverse)\b', query) or \
#        re.search(r'\b(recent|latest|newest)\b', query):
#         if 'price' in query:
#             return 'ORDER BY price DESC'
#         elif 'name' in query:
#             return 'ORDER BY name DESC'
#         elif 'date' in query or 'recent' in query or 'latest' in query:
#             return 'ORDER BY order_date DESC'

#     return None


# def _detect_limit(query: str) -> str:
#     """Detect LIMIT requirements"""
#     # Explicit limit
#     limit_match = re.search(r'\b(?:limit|top|first)\s+(\d+)', query)
#     if limit_match:
#         return f"LIMIT {limit_match.group(1)}"

#     # Keywords suggesting limited results
#     if re.search(r'\b(recent|latest|top|first)\b', query) and not re.search(r'\d+', query):
#         return "LIMIT 10"

#     return None


# def _build_sql_query(table_name: str, columns: list, filters: list,
#                      aggregation: dict, needs_join: dict, sort_clause: str,
#                      limit_clause: str, schema: dict) -> str:
#     """Build the final optimized SQL query"""

#     # Handle JOIN queries
#     if needs_join:
#         return _build_join_query(needs_join, filters, sort_clause, limit_clause)

#     # Handle aggregation queries
#     if aggregation:
#         return _build_aggregation_query(table_name, aggregation, filters)

#     # Build SELECT clause
#     if columns == ['*']:
#         select_clause = "SELECT *"
#     else:
#         select_clause = f"SELECT {', '.join(columns)}"

#     # Build FROM clause
#     from_clause = f"FROM {table_name}"

#     # Build WHERE clause
#     where_clause = ""
#     if filters:
#         where_clause = f"WHERE {' AND '.join(filters)}"

#     # Combine all parts
#     sql_parts = [select_clause, from_clause]

#     if where_clause:
#         sql_parts.append(where_clause)

#     if sort_clause:
#         sql_parts.append(sort_clause)

#     if limit_clause:
#         sql_parts.append(limit_clause)

#     return ' '.join(sql_parts) + ';'


# def _build_join_query(join_info: dict, filters: list, sort_clause: str, limit_clause: str) -> str:
#     """Build JOIN queries"""
#     if join_info['type'] == 'customer_orders':
#         sql = """SELECT c.name as customer_name, c.email, o.order_id, o.quantity, o.order_date
# FROM orders o
# JOIN customers c ON o.customer_id = c.customer_id"""

#     elif join_info['type'] == 'product_orders':
#         sql = """SELECT p.name as product_name, p.category, p.price, o.quantity, o.order_date
# FROM orders o
# JOIN products p ON o.product_id = p.product_id"""

#     elif join_info['type'] == 'full_order_details':
#         sql = """SELECT c.name as customer_name, p.name as product_name, p.price, o.quantity, o.order_date, (p.price * o.quantity) as total_cost
# FROM orders o
# JOIN customers c ON o.customer_id = c.customer_id
# JOIN products p ON o.product_id = p.product_id"""

#     if filters:
#         sql += f"\nWHERE {' AND '.join(filters)}"

#     if sort_clause:
#         sql += f"\n{sort_clause}"

#     if limit_clause:
#         sql += f"\n{limit_clause}"

#     return sql + ';'


# def _build_aggregation_query(table: str, agg: dict, filters: list) -> str:
#     """Build aggregation queries"""
#     if agg['column'] == '*':
#         select_clause = f"SELECT {agg['function']}(*) as {agg['alias']}"
#     else:
#         select_clause = f"SELECT {agg['function']}({agg['column']}) as {agg['alias']}"

#     sql = f"{select_clause} FROM {table}"

#     if filters:
#         sql += f" WHERE {' AND '.join(filters)}"

#     return sql + ';'

# # Main endpoint to generate SQL from natural language
# @app.post("/generate-sql")
# async def generate_sql(data: NLQuery):
#     try:
#         nl_query = data.nl_query
#         schema = data.schema

#         if USE_MOCK:
#             # Use advanced generator if available, otherwise fallback to basic
#             if advanced_generator:
#                 sql = advanced_generator.generate(nl_query)
#             else:
#                 sql = generate_mock_sql(nl_query)
#         else:
#             # Check if model is loaded
#             if not model_loaded:
#                 if not model_loading:
#                     # Start loading model asynchronously
#                     asyncio.create_task(load_model_async())
#                 raise HTTPException(
#                     status_code=503,
#                     detail="Model is loading. Please try again in a few moments."
#                 )

#             # Real model inference
#             prompt = f"translate English to SQL: {nl_query} {schema}"
#             inputs = tokenizer(prompt, return_tensors="pt")
#             outputs = model.generate(**inputs, max_length=200)
#             sql = tokenizer.decode(outputs[0], skip_special_tokens=True)

#         return {
#             "sql": sql,
#             "query": nl_query,
#             "mock_mode": USE_MOCK,
#             "advanced_mode": USE_ADVANCED_GENERATOR and advanced_generator is not None
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error generating SQL: {str(e)}") from e

# async def load_model_async():
#     """
#     Load the model asynchronously to prevent blocking the main thread
#     """
#     global tokenizer, model, model_loading, model_loaded

#     if model_loading or model_loaded:
#         return

#     model_loading = True
#     print("Starting async model loading...")

#     try:
#         from transformers import T5Tokenizer, T5ForConditionalGeneration

#         print("Loading tokenizer and model... This may take 10-20 minutes.")
#         MODEL_NAME = "tscholak/cxmefzzi"  # fine-tuned T5 for text-to-SQL (Spider dataset)

#         # Load in background thread to avoid blocking
#         loop = asyncio.get_event_loop()
#         tokenizer = await loop.run_in_executor(
#             None,
#             T5Tokenizer.from_pretrained,
#             MODEL_NAME
#         )
#         model = await loop.run_in_executor(
#             None,
#             T5ForConditionalGeneration.from_pretrained,
#             MODEL_NAME
#         )

#         model_loaded = True
#         print("Model loaded successfully!")
#     except Exception as e:
#         print(f"Error loading model: {e}")
#     finally:
#         model_loading = False

# # Optional: endpoint to trigger model loading manually
# @app.post("/load-model")
# async def trigger_model_load():
#     if USE_MOCK:
#         return {"message": "Server is in mock mode. Set USE_MOCK=False to enable model loading."}

#     if model_loaded:
#         return {"message": "Model already loaded"}

#     if model_loading:
#         return {"message": "Model is currently loading"}

#     asyncio.create_task(load_model_async())
#     return {"message": "Model loading started in background"}
