import sys

def solve():
    # Fast I/O for competitive programming
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    N = int(input_data[0])
    C = int(input_data[1])
    A = [int(x) for x in input_data[2:2+N]]
    
    # Simulates the process for a given initial amount of oil x
    def get_disturbances(x):
        disturbances = 0
        current_oil = x
        for action in A:
            if action == 1:
                if current_oil == C:
                    disturbances += 1
                else:
                    current_oil += 1
            elif action == -1:
                if current_oil == 0:
                    disturbances += 1
                else:
                    current_oil -= 1
        return disturbances
        
    # Binary search to find the minimum X that minimizes disturbances
    low = 0
    high = C
    
    while low < high:
        mid = (low + high) // 2
        d1 = get_disturbances(mid)
        d2 = get_disturbances(mid + 1)
        
        # If disturbances start increasing or plateau, the minimum is to the left (or at mid)
        if d1 <= d2:
            high = mid
        # If disturbances are still decreasing, the minimum must be strictly to the right
        else:
            low = mid + 1
            
    print(low)

if __name__ == '__main__':
    solve()