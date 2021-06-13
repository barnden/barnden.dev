---
layout: post
title:  "Compile Time For Loops in C++"
date:   2020-07-02 12:00:00
modified_date: 2021-06-13 00:00:00
categories: notes c++

excerpt: Run-time loops are overrated.
---

This is a cool trick I learned from [bisqwit's video](https://youtu.be/PahbNFypubE?t=1109).

A typical for loop in C++:

```cpp
for (auto i = 0UZ; i < N; i++) {
    function(I);
}
```

A very cool compile time for-loop in ISO C++20 (or GNU++17 w/gcc 8+):
```cpp
[&]<std::size_t ...I>(std::index_sequence<I...>)
{
    (function(I), ...);
}
(std::make_index_sequence<N>{});
```

Which then effectively gets compiled into:
```cpp
( function(0),
  function(1),
  function(2),
  /* ... */
  function(N - 1)
);
```

The comma operator can be replaced with any other operator in C++, or in the function call as a parameter expansion.

This is useful if `function(x)` requires a compile time constant, or for unrolling the loop (but the compiler should do that, not you).

{% example %}
Parameter Expansion

```cpp
[&]<std::size_t ...I>(std::index_sequence<I...>)
{
    function(std::get<I>(params).get() ...);
}
(std::make_index_sequence<std::tuple_size_v<decltype(params)>>{ });
```

The `std::get<N>()` function requires a template parameter, `N`, as such it must be some compile-time constant. In this instance, we cannot use a run-time loop, and *can* opt for this compile-time loop pattern.

Or, we can just:

```cpp
function(params[0].get(), pkarams[1].get() /* et ad nauseam */);
```
{% endexample %}
