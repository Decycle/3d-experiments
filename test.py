a = [12, 44, 13, 88, 23, 94, 11, 39, 20, 16, 5]

taken = []

for k in a:
    h = (3 * k + 5) % 11

    i = 1

    new_h = h
    while new_h in taken:
        print(new_h)
        new_h = (h + i * i) % 11
        i += 1
    print(taken)
    taken.append(new_h)
