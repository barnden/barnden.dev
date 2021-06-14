---
layout: post
title:  "Extending Rouge's C++ Support"
date:   2021-06-14 13:48:14
categories: jekyll ruby regex c++
---

Jekyll has support for syntax highlighting of code blocks through [rouge](https://github.com/rouge-ruby/rouge). However, I found rouge's lexers to be quite underwhelming when it comes to C/C++.

### Adding Keywords

{% example %}
Concepts

Starting with C++20, we have `concepts` and `requires` which constrain the types that can be passed to templates.

<div class="language-cpp highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">template</span><span class="o">&lt;</span><span class="k">typename</span> <span class="nc">T</span><span class="p">&gt;</span>
<span class="n">concept</span> <span class="n">Hashable</span> <span class="o">=</span> <span class="n">requires</span><span class="p">(</span><span class="n">T</span> <span class="n">a</span><span class="p">)</span> <span class="p">{</span>
    <span class="p">{</span> <span class="n">std</span><span class="o">::</span><span class="n">hash</span><span class="o">&lt;</span><span class="n">T</span><span class="o">&gt;</span><span class="p">{}(</span><span class="n">a</span><span class="p">)</span> <span class="p">}</span> <span class="o">-&gt;</span> <span class="n">std</span><span class="o">::</span><span class="n">convertible_to</span><span class="o">&lt;</span><span class="n">std</span><span class="o">::</span><span class="kt">size_t</span><span class="o">&gt;</span><span class="p">;</span>
<span class="p">};</span>
</code></pre></div>  </div>

<figcaption markdown="1">
Example from [cppreference](https://en.cppreference.com/w/cpp/language/constraints).
</figcaption>

The `concept` and `requires` keywords should have the same emphasis and highlighting as the `template` and `typename` keywords.
{% endexample %}

{% example %}
consteval

The `consteval` keyword is part of C++20 onwards, and `if consteval` starting from C++23.
<div class="language-cpp highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">constexpr</span> <span class="kt">int</span> <span class="nf">i</span><span class="p">(</span><span class="kt">int</span> <span class="n">j</span><span class="p">)</span>
<span class="p">{</span>
    <span class="k">if</span> <span class="n">consteval</span> <span class="p">{</span>
        <span class="k">return</span> <span class="n">i</span> <span class="o">+</span> <span class="mi">1</span><span class="p">;</span>
    <span class="p">}</span> <span class="k">else</span> <span class="p">{</span>
        <span class="k">return</span> <span class="mi">1</span><span class="p">;</span>
    <span class="p">}</span>
<span class="p">}</span>
</code></pre></div>  </div>

The `consteval` does not have the same formatting as `constexpr`.
{% endexample %}

The missing emphasis on `concept`, `requires`, and `consteval` is very simple. To start, we look at the lexer at `lib/rouge/lexers/cpp.rb`. Inside, we find inside the `keywords` method of the C++ lexer, and we need to add C++ specific keywords.

```ruby
def self.keywords
    @keywords ||= super + Set.new(%w(
        asm auto catch const_cast delete dynamic_cast explicit export friend
        mutable namespace new operator private protected public
        reinterpret_cast restrict size_of static_cast this throw throws
        typeid typename using virtual final override

        alignas alignof constexpr decltype noexcept static_assert
        thread_local try
    ))
end
```

All we have to do is add `concept`, `requires`, and `consteval` to this list, and we get nicer formatting.

```cpp
template<typename T>
concept Hashable = requires(T a) {
    { std::hash<T>{}(a) } -> std::convertible_to<std::size_t>;
};

consteval int a() { return 29; }
```

---

### Improving Preprocessor Highlighting

{% example %}
Preprocessor Directives

Preprocessor directives, the antithesis of bleeding-edge, yields this monochromatic mess:
<div class="language-cpp highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="cp">#include &lt;unistd.h&gt;

#if __cplusplus
#    ifndef __BEGIN_DECLS
#        define __BEGIN_DECLS extern "C" {
#        define __END_DECLS   }
#    endif
#else
#    ifndef __BEGIN_DECLS
#        define __BEGIN_DECLS
#        define __END_DECLS
#    endif
#endif
</span></code></pre></div></div>

<figcaption markdown="1">
This was mentioned in issue [#1680](https://github.com/rouge-ruby/rouge/issues/1680).
</figcaption>
{% endexample %}

For preprocessor directives, it is slightly harder. There is no explicit mention of the preprocessor in the C++ lexer, however, at the top of the file we see `load_lexer 'c.rb'`.

So looking inside `lib/rouge/lexers/cpp.rb`, we see:

```ruby
state :expr_bol do
    mixin :inline_whitespace

    rule %r/#if\s0/, Comment, :if_0
    rule %r/#/, Comment::Preproc, :macro

    rule(//) { pop! }
end
```

We see here that by default, if it sees a `#` it will make the entire line `Comment::Preproc` and set the state of the lexer to `macro`. Jumping to the macro definition:

```ruby
state :macro do
    # NB: pop! goes back to :bol
    rule %r/\n/, Comment::Preproc, :pop!
    rule %r([^/\n\\]+), Comment::Preproc
    rule %r/\\./m, Comment::Preproc
    mixin :inline_whitespace
    rule %r(/), Comment::Preproc
end
```

At first glance this bit of regex popped out
```ruby
rule %r([^/\n\\]+), Comment::Preproc
```

There's just no differentiation, it simply selects everything up until a new line, and marks it as `Comment::Preproc`.

So, I came up with two rules that massively improved the syntax highlighting:
```ruby
rule %r([^\s]+), Comment::Preproc
```
The first rule uses a regex expression that captures everything from the `#` to the first whitespace character, and marks it as `Comment::Preproc`. This ensures that the directive is distinct from everything that comes after.

Then, the second rule:
```ruby
rule %r/\s(.[^\n\s]+)/, Name::Function, :pop!
```
It takes everything after the first, and before the second whitespace character and marks it as `Name::Function`. If the preprocessor directive takes some parameter, like `#define` takes the name of the macro, it will give it a different emphasis. Then, it will pop the state of the lexer, and then highlight the rest of the tokens without the context of it being a macro.

After applying these new rules, we can see the effect it had:
```cpp
#include <unistd.h>

#if __cplusplus
#    ifndef __BEGIN_DECLS
#        define __BEGIN_DECLS extern "C" {
#        define __END_DECLS   }
#    endif
#else
#    ifndef __BEGIN_DECLS
#        define __BEGIN_DECLS
#        define __END_DECLS
#    endif
#endif
```

But, the second rule is just a hack, as we demonstrated below:
```cpp
#define MACRO1 0
#define MACRO2 0

#if MACRO1 == MACRO2
#endif
```

We would expect `MACRO2` in the boolean expression to be the same color as `MACRO1`, but it is not. It would probably be better to not use this second rule and pop after the first rule.

It would be nice if we could have this emphasis, but it would have to be through some form of parser, not through regex.

---

### Misc. Issues

These are things that popped out to me when using rouge, but I have not yet fixed:

{% example %}
Missing C++23

A very simple feature from C++23 are type suffixes for `size_t` and `ssize_t`, which are `uz` and `z`.

<div class="language-cpp highlighter-rouge">
    <div class="highlight">
        <pre class="highlight"><code><span class="k">for</span> <span class="p">(</span><span class="k">auto</span> <span class="n">i</span> <span class="o">=</span> <span class="mi">0u</span><span class="n">z</span><span class="p">;</span> <span class="n">i</span> <span class="o">&lt;</span> <span class="mi">10</span><span class="p">;</span> <span class="n">i</span><span class="o">++</span><span class="p">);</span></code></pre>
    </div>
</div>

See how the `z` in the `uz` literal suffix is not highlighted.
{% endexample %}

{% example %}
Function Calls

All function calls do not have any syntax highlighting.
```cpp
auto variable = 0;
function(1);
```

Notice how `function` has the same highlighting as `variable`. In my opinion, the `function` token should have a different emphasis/color.
{% endexample %}

{% example %}
Template Parameters

If you look back to the concept example, you may have noticed that the `>` to close off the template parameters does not match the `<` in color.

```cpp
template<typename T>
```
{% endexample %}

As an aside, I am extremely amused that the spaceship operator from C++20 is recognized:

```cpp
auto operator<=>(const DummyType& rhs) const = default;
```
