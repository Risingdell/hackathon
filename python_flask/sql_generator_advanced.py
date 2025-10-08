"""
Advanced SQL Generator - Phase 2 Implementation
Includes: OR conditions, DISTINCT, IN/NOT IN, LIKE patterns, GROUP BY, HAVING, NULL handling
"""
import re
from typing import List, Dict, Optional, Tuple


class AdvancedSQLGenerator:
    """
    Advanced SQL generator with support for complex queries
    """

    def __init__(self):
        self.schema = {
            'customers': {
                'columns': ['customer_id', 'name', 'email', 'city', 'created_at'],
                'aliases': {'customer': 'customers', 'client': 'customers', 'buyer': 'customers'}
            },
            'products': {
                'columns': ['product_id', 'name', 'category', 'price', 'stock'],
                'aliases': {'product': 'products', 'item': 'products', 'goods': 'products'}
            },
            'orders': {
                'columns': ['order_id', 'customer_id', 'product_id', 'quantity', 'order_date'],
                'aliases': {'order': 'orders', 'purchase': 'orders', 'sale': 'orders'}
            }
        }

    def generate(self, nl_query: str) -> str:
        """Main entry point for SQL generation"""
        query_lower = nl_query.lower()

        # Check for special keywords
        has_distinct = self._check_distinct(query_lower)
        has_group_by = self._check_group_by(query_lower)

        # Detect table
        table_name = self._detect_table(query_lower)

        # Extract filters (with OR support)
        filters, filter_logic = self._extract_filters_advanced(query_lower, table_name)

        # Extract columns
        requested_columns = self._extract_columns(query_lower, table_name)

        # Check aggregation
        aggregation = self._detect_aggregation(query_lower)

        # Check JOIN
        needs_join = self._detect_join_requirement(query_lower)

        # Check GROUP BY
        group_by = self._detect_group_by_clause(query_lower, table_name) if has_group_by else None

        # Check HAVING
        having_clause = self._detect_having_clause(query_lower) if group_by else None

        # Check sorting
        sort_clause = self._detect_sorting(query_lower)

        # Check limit
        limit_clause = self._detect_limit(query_lower)

        # Build SQL
        sql = self._build_sql_query(
            table_name=table_name,
            columns=requested_columns,
            distinct=has_distinct,
            filters=filters,
            filter_logic=filter_logic,
            aggregation=aggregation,
            needs_join=needs_join,
            group_by=group_by,
            having_clause=having_clause,
            sort_clause=sort_clause,
            limit_clause=limit_clause
        )

        return sql

    def _check_distinct(self, query: str) -> bool:
        """Check if DISTINCT is needed"""
        return bool(re.search(r'\b(unique|distinct|different)\b', query))

    def _check_group_by(self, query: str) -> bool:
        """Check if GROUP BY is needed"""
        group_keywords = [
            r'\bby\s+(city|category|customer|product|date)',
            r'\bper\s+(city|category|customer|product)',
            r'\beach\s+(city|category|customer|product)',
            r'\bgroup\s+by\b'
        ]
        return any(re.search(pattern, query) for pattern in group_keywords)

    def _detect_table(self, query: str) -> str:
        """Detect primary table"""
        table_scores = {}
        for table, info in self.schema.items():
            score = 0
            if table in query or table[:-1] in query:
                score += 10
            for alias in info['aliases'].keys():
                if alias in query:
                    score += 5
            table_scores[table] = score

        if max(table_scores.values()) > 0:
            return max(table_scores, key=table_scores.get)
        return 'customers'

    def _extract_filters_advanced(self, query: str, table: str) -> Tuple[List[str], str]:
        """
        Extract filters with support for OR conditions
        Returns: (filters_list, logic_type)
        logic_type: 'AND', 'OR', or 'MIXED'
        """
        filters = []
        logic = 'AND'  # default

        # Check for OR keywords
        has_or = bool(re.search(r'\b(or|either)\b', query))

        if has_or:
            logic = 'OR'
            filters = self._extract_or_filters(query, table)
        else:
            filters = self._extract_and_filters(query, table)

        return filters, logic

    def _extract_or_filters(self, query: str, table: str) -> List[str]:
        """Extract filters for OR conditions"""
        filters = []

        if table == 'customers':
            # Cities with OR
            city_or_match = re.search(r'\bfrom\s+([a-z\s]+)\s+or\s+([a-z\s]+)', query)
            if city_or_match:
                city1, city2 = city_or_match.groups()
                return [f"city = '{city1.strip().title()}'", f"city = '{city2.strip().title()}'"]

            # IN clause for cities
            cities_in_match = re.search(r'\bfrom\s+([a-z\s,]+(?:\s+or\s+[a-z\s,]+)*)', query)
            if cities_in_match:
                cities_text = cities_in_match.group(1)
                cities = [c.strip().title() for c in re.split(r',|\s+or\s+|\s+and\s+', cities_text) if c.strip()]
                if len(cities) > 1:
                    cities_sql = "', '".join(cities)
                    return [f"city IN ('{cities_sql}')"]

        elif table == 'products':
            # Categories with OR
            cat_or_match = re.search(r'\b(in|from)\s+([a-z\s]+)\s+or\s+([a-z\s]+)', query)
            if cat_or_match:
                cat1, cat2 = cat_or_match.group(2), cat_or_match.group(3)
                return [f"category = '{cat1.strip().title()}'", f"category = '{cat2.strip().title()}'"]

            # IN clause for categories
            cats_in_match = re.search(r'\b(in|from)\s+([a-z\s,]+(?:\s+or\s+[a-z\s,]+)*)', query)
            if cats_in_match:
                cats_text = cats_in_match.group(2)
                categories = [c.strip().title() for c in re.split(r',|\s+or\s+|\s+and\s+', cats_text) if c.strip() and c.strip() not in ['category', 'categories']]
                if len(categories) > 1:
                    cats_sql = "', '".join(categories)
                    return [f"category IN ('{cats_sql}')"]

        return filters

    def _extract_and_filters(self, query: str, table: str) -> List[str]:
        """Extract filters for AND conditions (existing logic)"""
        filters = []

        if table == 'customers':
            # City filter
            city_patterns = [
                r'\b(from|in|at|located in)\s+["\']?([a-z\s]+?)["\']?(?:\s|$|,)',
                r'\bcity\s*(?:is|=|:)?\s*["\']?([a-z\s]+?)["\']?(?:\s|$|,)',
                r'\b(new york|chicago|boston|san francisco|los angeles|seattle|miami)\b'
            ]
            for pattern in city_patterns:
                match = re.search(pattern, query)
                if match:
                    city = match.group(2) if len(match.groups()) > 1 else match.group(1)
                    city = city.strip().title()
                    filters.append(f"city = '{city}'")
                    break

            # Email filter with NULL handling
            if 'without email' in query or 'no email' in query:
                filters.append("email IS NULL")
            elif 'with email' in query or 'has email' in query:
                filters.append("email IS NOT NULL")
            else:
                email_match = re.search(r'\bemail\s*(?:is|=|like|contains)?\s*["\']?([a-z0-9@.]+)["\']?', query)
                if email_match:
                    email = email_match.group(1).strip()
                    if '@' in email:
                        filters.append(f"email = '{email}'")
                    else:
                        filters.append(f"email LIKE '%{email}%'")

            # Name filter with LIKE patterns
            if 'starts with' in query:
                name_start = re.search(r'starts with\s+["\']?([a-z]+)["\']?', query)
                if name_start:
                    letter = name_start.group(1).strip().title()
                    filters.append(f"name LIKE '{letter}%'")
            elif 'ends with' in query:
                name_end = re.search(r'ends with\s+["\']?([a-z]+)["\']?', query)
                if name_end:
                    suffix = name_end.group(1).strip()
                    filters.append(f"name LIKE '%{suffix}'")
            elif 'contains' in query or 'with name' in query:
                name_match = re.search(r'(?:contains|with name|name contains)\s+["\']?([a-z\s]+)["\']?', query)
                if name_match:
                    name = name_match.group(1).strip().title()
                    filters.append(f"name LIKE '%{name}%'")

        elif table == 'products':
            # Category filter
            category_patterns = [
                r'\b(electronics|furniture|accessories|clothing|food|books|toys)\b',
                r'\bcategory\s*(?:is|=|:)?\s*["\']?([a-z\s]+?)["\']?(?:\s|$)',
                r'\b(in|from|of)\s+(?:the\s+)?["\']?([a-z\s]+?)["\']?\s+category',
            ]
            for pattern in category_patterns:
                match = re.search(pattern, query)
                if match:
                    category = match.group(1) if len(match.groups()) == 1 else match.group(2)
                    category = category.strip().title()
                    filters.append(f"category = '{category}'")
                    break

            # Price filters with all operators
            price_operators = {
                r'\bprice\s*(?:greater than|more than|above|>)\s*(\d+(?:\.\d+)?)': '>',
                r'\bprice\s*(?:less than|below|under|<)\s*(\d+(?:\.\d+)?)': '<',
                r'\bprice\s*(?:equals?|is|=)\s*(\d+(?:\.\d+)?)': '=',
                r'\bprice\s*(?:at least|minimum)\s*(\d+(?:\.\d+)?)': '>=',
                r'\bprice\s*(?:at most|maximum)\s*(\d+(?:\.\d+)?)': '<=',
                r'\bprice\s*(?:not|!=)\s*(\d+(?:\.\d+)?)': '!='
            }
            for pattern, operator in price_operators.items():
                match = re.search(pattern, query)
                if match:
                    price = match.group(1)
                    filters.append(f"price {operator} {price}")
                    break

            # Price BETWEEN
            range_match = re.search(r'\bprice\s+between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)', query)
            if range_match:
                min_price, max_price = range_match.groups()
                filters.append(f"price BETWEEN {min_price} AND {max_price}")

            # Stock filter with NULL handling
            if 'in stock' in query or 'available' in query:
                filters.append("stock > 0")
            elif 'out of stock' in query or 'unavailable' in query:
                filters.append("stock = 0")
            elif 'stock unknown' in query or 'no stock info' in query:
                filters.append("stock IS NULL")

        elif table == 'orders':
            # Date filters
            date_patterns = {
                r'\b(?:on|at|date)\s+["\']?(\d{4}-\d{2}-\d{2})["\']?': '=',
                r'\b(?:after|since)\s+["\']?(\d{4}-\d{2}-\d{2})["\']?': '>',
                r'\b(?:before|until)\s+["\']?(\d{4}-\d{2}-\d{2})["\']?': '<',
            }
            for pattern, operator in date_patterns.items():
                match = re.search(pattern, query)
                if match:
                    date = match.group(1)
                    filters.append(f"order_date {operator} '{date}'")
                    break

            # Quantity filter
            quantity_match = re.search(r'\bquantity\s*(?:greater than|more than|>)\s*(\d+)', query)
            if quantity_match:
                qty = quantity_match.group(1)
                filters.append(f"quantity > {qty}")

        return filters

    def _extract_columns(self, query: str, table: str) -> List[str]:
        """Extract specific columns"""
        specific_keywords = {
            'name': ['name'],
            'email': ['email'],
            'city': ['city'],
            'price': ['price'],
            'category': ['category'],
            'stock': ['stock'],
            'quantity': ['quantity'],
            'date': ['order_date', 'created_at'],
            'id': ['customer_id', 'product_id', 'order_id']
        }

        requested = []

        if re.search(r'\b(only|just)\b', query):
            for keyword, cols in specific_keywords.items():
                if keyword in query:
                    for col in cols:
                        if col in self.schema[table]['columns']:
                            requested.append(col)

        return requested if requested else ['*']

    def _detect_aggregation(self, query: str) -> Optional[Dict]:
        """Detect aggregation functions"""
        agg = {'function': None, 'column': None, 'alias': None}

        # COUNT
        if re.search(r'\b(count|how many|number of|total number)\b', query):
            agg['function'] = 'COUNT'
            agg['column'] = '*'
            agg['alias'] = 'total_count'
            if 'customer' in query:
                agg['alias'] = 'total_customers'
            elif 'product' in query:
                agg['alias'] = 'total_products'
            elif 'order' in query:
                agg['alias'] = 'total_orders'

        # SUM
        elif re.search(r'\b(sum|total|sum of)\b', query):
            agg['function'] = 'SUM'
            if 'price' in query or 'revenue' in query or 'sales' in query:
                agg['column'] = 'price'
                agg['alias'] = 'total_amount'
            elif 'quantity' in query:
                agg['column'] = 'quantity'
                agg['alias'] = 'total_quantity'

        # AVG
        elif re.search(r'\b(average|avg|mean)\b', query):
            agg['function'] = 'AVG'
            if 'price' in query:
                agg['column'] = 'price'
                agg['alias'] = 'average_price'

        # MAX
        elif re.search(r'\b(max|maximum|highest|most expensive)\b', query):
            agg['function'] = 'MAX'
            if 'price' in query:
                agg['column'] = 'price'
                agg['alias'] = 'max_price'

        # MIN
        elif re.search(r'\b(min|minimum|lowest|cheapest)\b', query):
            agg['function'] = 'MIN'
            if 'price' in query:
                agg['column'] = 'price'
                agg['alias'] = 'min_price'

        return agg if agg['function'] else None

    def _detect_join_requirement(self, query: str) -> Optional[Dict]:
        """Detect JOIN operations"""
        joins = None

        if ('customer' in query and 'order' in query) or ('buyer' in query and 'purchase' in query):
            joins = {'type': 'customer_orders'}
        elif ('product' in query and 'order' in query) or ('item' in query and 'purchase' in query):
            joins = {'type': 'product_orders'}
        elif ('customer' in query and 'product' in query and 'order' in query) or 'order details' in query:
            joins = {'type': 'full_order_details'}

        return joins

    def _detect_group_by_clause(self, query: str, table: str) -> Optional[List[str]]:
        """Detect GROUP BY columns"""
        group_cols = []

        group_patterns = {
            r'\bby\s+city\b': ['city'],
            r'\bby\s+category\b': ['category'],
            r'\bper\s+city\b': ['city'],
            r'\bper\s+category\b': ['category'],
            r'\beach\s+city\b': ['city'],
            r'\beach\s+category\b': ['category'],
            r'\bby\s+customer\b': ['customer_id'],
            r'\bper\s+customer\b': ['customer_id'],
        }

        for pattern, cols in group_patterns.items():
            if re.search(pattern, query):
                group_cols.extend(cols)
                break

        return group_cols if group_cols else None

    def _detect_having_clause(self, query: str) -> Optional[str]:
        """Detect HAVING clause"""
        # "more than X", "at least X", "greater than X"
        having_match = re.search(r'\b(?:with|having)\s+(?:more than|at least|greater than|>)\s+(\d+)', query)
        if having_match:
            threshold = having_match.group(1)
            return f"COUNT(*) > {threshold}"

        # "less than X", "at most X", "fewer than X"
        having_match2 = re.search(r'\b(?:with|having)\s+(?:less than|at most|fewer than|<)\s+(\d+)', query)
        if having_match2:
            threshold = having_match2.group(1)
            return f"COUNT(*) < {threshold}"

        return None

    def _detect_sorting(self, query: str) -> Optional[str]:
        """Detect ORDER BY"""
        if re.search(r'\b(sort|order)\b.*\b(asc|ascending|lowest|alphabetical)\b', query):
            if 'price' in query:
                return 'ORDER BY price ASC'
            elif 'name' in query:
                return 'ORDER BY name ASC'
            elif 'date' in query:
                return 'ORDER BY order_date ASC'

        if re.search(r'\b(sort|order)\b.*\b(desc|descending|highest|reverse)\b', query) or \
           re.search(r'\b(recent|latest|newest)\b', query):
            if 'price' in query:
                return 'ORDER BY price DESC'
            elif 'name' in query:
                return 'ORDER BY name DESC'
            elif 'date' in query or 'recent' in query or 'latest' in query:
                return 'ORDER BY order_date DESC'

        return None

    def _detect_limit(self, query: str) -> Optional[str]:
        """Detect LIMIT"""
        limit_match = re.search(r'\b(?:limit|top|first)\s+(\d+)', query)
        if limit_match:
            return f"LIMIT {limit_match.group(1)}"

        if re.search(r'\b(recent|latest|top|first)\b', query) and not re.search(r'\d+', query):
            return "LIMIT 10"

        return None

    def _build_sql_query(self, table_name: str, columns: List[str], distinct: bool,
                         filters: List[str], filter_logic: str, aggregation: Optional[Dict],
                         needs_join: Optional[Dict], group_by: Optional[List[str]],
                         having_clause: Optional[str], sort_clause: Optional[str],
                         limit_clause: Optional[str]) -> str:
        """Build final SQL query"""

        # Handle JOINs
        if needs_join:
            return self._build_join_query(needs_join, filters, filter_logic, sort_clause, limit_clause)

        # Handle aggregation with GROUP BY
        if aggregation and group_by:
            return self._build_grouped_aggregation(table_name, aggregation, group_by, filters, filter_logic, having_clause, sort_clause)

        # Handle aggregation without GROUP BY
        if aggregation:
            return self._build_aggregation_query(table_name, aggregation, filters, filter_logic)

        # Build regular SELECT
        distinct_keyword = "DISTINCT " if distinct else ""

        if columns == ['*']:
            select_clause = f"SELECT {distinct_keyword}*"
        else:
            select_clause = f"SELECT {distinct_keyword}{', '.join(columns)}"

        from_clause = f"FROM {table_name}"

        # Build WHERE
        where_clause = ""
        if filters:
            if filter_logic == 'OR':
                where_clause = f"WHERE {' OR '.join(filters)}"
            else:
                where_clause = f"WHERE {' AND '.join(filters)}"

        # Combine parts
        sql_parts = [select_clause, from_clause]
        if where_clause:
            sql_parts.append(where_clause)
        if sort_clause:
            sql_parts.append(sort_clause)
        if limit_clause:
            sql_parts.append(limit_clause)

        return ' '.join(sql_parts) + ';'

    def _build_aggregation_query(self, table: str, agg: Dict, filters: List[str], logic: str) -> str:
        """Build aggregation query without GROUP BY"""
        if agg['column'] == '*':
            select_clause = f"SELECT {agg['function']}(*) as {agg['alias']}"
        else:
            select_clause = f"SELECT {agg['function']}({agg['column']}) as {agg['alias']}"

        sql = f"{select_clause} FROM {table}"

        if filters:
            if logic == 'OR':
                sql += f" WHERE {' OR '.join(filters)}"
            else:
                sql += f" WHERE {' AND '.join(filters)}"

        return sql + ';'

    def _build_grouped_aggregation(self, table: str, agg: Dict, group_by: List[str],
                                   filters: List[str], logic: str, having: Optional[str],
                                   sort: Optional[str]) -> str:
        """Build aggregation query with GROUP BY"""
        group_cols = ', '.join(group_by)

        if agg['column'] == '*':
            select_clause = f"SELECT {group_cols}, {agg['function']}(*) as {agg['alias']}"
        else:
            select_clause = f"SELECT {group_cols}, {agg['function']}({agg['column']}) as {agg['alias']}"

        sql = f"{select_clause} FROM {table}"

        if filters:
            if logic == 'OR':
                sql += f" WHERE {' OR '.join(filters)}"
            else:
                sql += f" WHERE {' AND '.join(filters)}"

        sql += f" GROUP BY {group_cols}"

        if having:
            sql += f" HAVING {having}"

        if sort:
            sql += f" {sort}"

        return sql + ';'

    def _build_join_query(self, join_info: Dict, filters: List[str], logic: str,
                         sort_clause: Optional[str], limit_clause: Optional[str]) -> str:
        """Build JOIN queries"""
        if join_info['type'] == 'customer_orders':
            sql = """SELECT c.name as customer_name, c.email, o.order_id, o.quantity, o.order_date
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id"""

        elif join_info['type'] == 'product_orders':
            sql = """SELECT p.name as product_name, p.category, p.price, o.quantity, o.order_date
FROM orders o
JOIN products p ON o.product_id = p.product_id"""

        elif join_info['type'] == 'full_order_details':
            sql = """SELECT c.name as customer_name, p.name as product_name, p.price, o.quantity, o.order_date, (p.price * o.quantity) as total_cost
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN products p ON o.product_id = p.product_id"""

        if filters:
            if logic == 'OR':
                sql += f"\nWHERE {' OR '.join(filters)}"
            else:
                sql += f"\nWHERE {' AND '.join(filters)}"

        if sort_clause:
            sql += f"\n{sort_clause}"

        if limit_clause:
            sql += f"\n{limit_clause}"

        return sql + ';'
