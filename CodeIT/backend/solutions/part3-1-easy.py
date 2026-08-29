import sys

# Increase recursion depth for deep segment tree traversal
sys.setrecursionlimit(200005)

def solve():
    # Fast I/O for competitive programming
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    n = int(input_data[0])
    A = [int(x) for x in input_data[1:n+1]]
    q = int(input_data[n+1])
    
    queries = []
    idx = n + 2
    for _ in range(q):
        queries.append((int(input_data[idx]), int(input_data[idx+1]), int(input_data[idx+2])))
        idx += 3
        
    MOD = 10**9 + 7
    
    # 1D Arrays for Segment Tree to minimize overhead
    tree = [0] * (4 * n)
    lazy_C = [0] * (4 * n)
    lazy_D = [0] * (4 * n)
    has_lazy = [False] * (4 * n)
    
    def build(node, L, R):
        if L == R:
            tree[node] = A[L] % MOD
            return
        mid = (L + R) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2
        build(left_child, L, mid)
        build(right_child, mid + 1, R)
        tree[node] = (tree[left_child] + tree[right_child]) % MOD
        
    def sum_i(L, R):
        count = R - L + 1
        return (count * (L + R)) // 2
        
    def apply(node, L, R, C, D):
        total_elements = R - L + 1
        s_i = sum_i(L, R)
        tree[node] = (C * s_i + D * total_elements) % MOD
        lazy_C[node] = C
        lazy_D[node] = D
        has_lazy[node] = True
        
    def push(node, L, R):
        if has_lazy[node]:
            mid = (L + R) // 2
            left_child = 2 * node + 1
            right_child = 2 * node + 2
            apply(left_child, L, mid, lazy_C[node], lazy_D[node])
            apply(right_child, mid + 1, R, lazy_C[node], lazy_D[node])
            has_lazy[node] = False
            
    def update(node, L, R, qL, qR, C, D):
        if qL <= L and R <= qR:
            apply(node, L, R, C, D)
            return
        push(node, L, R)
        mid = (L + R) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2
        if qL <= mid:
            update(left_child, L, mid, qL, qR, C, D)
        if qR > mid:
            update(right_child, mid + 1, R, qL, qR, C, D)
        tree[node] = (tree[left_child] + tree[right_child]) % MOD
        
    def query(node, L, R, qL, qR):
        if qL <= L and R <= qR:
            return tree[node]
        push(node, L, R)
        mid = (L + R) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2
        ans = 0
        if qL <= mid:
            ans = (ans + query(left_child, L, mid, qL, qR)) % MOD
        if qR > mid:
            ans = (ans + query(right_child, mid + 1, R, qL, qR)) % MOD
        return ans
        
    build(0, 0, n - 1)
    
    total_ans = 0
    for type_q, l, r in queries:
        if type_q == 1:
            V = query(0, 0, n - 1, l, l)
            C = V
            D = (V * (1 - l)) % MOD
            update(0, 0, n - 1, l, r, C, D)
        elif type_q == 2:
            ans = query(0, 0, n - 1, l, r)
            total_ans = (total_ans + ans) % MOD
            
    print(total_ans)

if __name__ == '__main__':
    solve()