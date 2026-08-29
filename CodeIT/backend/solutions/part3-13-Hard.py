import sys

def solve():
    # Fast I/O
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    N = int(input_data[0])
    A = [int(x) for x in input_data[1:N+1]]
    
    # Precompute L[i]
    L = [0] * N
    freq_map_l = {}
    dist_l = 0
    for i in range(N):
        val = A[i]
        if val not in freq_map_l:
            freq_map_l[val] = 0
            dist_l += 1
        freq_map_l[val] += 1
        L[i] = freq_map_l[val] - (dist_l // 2)
        
    # Precompute R[j]
    R = [0] * N
    freq_map_r = {}
    dist_r = 0
    for i in range(N - 1, -1, -1):
        val = A[i]
        if val not in freq_map_r:
            freq_map_r[val] = 0
            dist_r += 1
        freq_map_r[val] += 1
        R[i] = freq_map_r[val] - (dist_r // 2)
        
    # Binary Indexed Tree (Fenwick Tree) setup
    # L[i] and -R[j] ranges safely within [-N, N]. Shift by N + 2 to make 1-indexed and positive.
    MAX_VAL = 2 * N + 5
    bit = [0] * (MAX_VAL + 1)
    
    def add(idx, val):
        while idx <= MAX_VAL:
            bit[idx] += val
            idx += idx & (-idx)
            
    def query(idx):
        idx = min(idx, MAX_VAL)
        if idx < 1:
            return 0
        res = 0
        while idx > 0:
            res += bit[idx]
            idx -= idx & (-idx)
        return res

    offset = N + 2
    ans = 0
    MOD = 10**9 + 7
    
    # For each j from 1 to N-1 (0-indexed)
    for j in range(1, N):
        # Insert the previous element's L value into the BIT
        add(L[j - 1] + offset, 1)
        
        # We need L[i] <= -R[j], therefore query for values <= -R[j] + offset
        target = -R[j] + offset
        if target >= 1:
            ans = (ans + query(target)) % MOD
            
    print(ans)

if __name__ == '__main__':
    solve()