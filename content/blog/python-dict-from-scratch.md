---
title: "Python's Dict, from scratch in pure Python"
date: 2021-12-06
authors: [["Clément Rebuffel", "/"]]

summary: Python's Dict is everywhere. In this blog post, we learn how it works, by coding it from scratch, in pure Python!
draft: False
---

# Python's Dict, from scratch

## Motivation

Python's Dict is everywhere, and if you code in Python, you're probably using it everyday. For instance, the famous [Two Sum puzzle](https://leetcode.com/problems/two-sum/) can easily be solved using a Dict. Why? Because contrary to a List, a Dict can be used for O(1) lookup, insertion and removal.

What we mean when we say O(1), is that looking for, inserting or removing an element from a Dict is done in constant time, and does not depend on the number of elements currently in the Dict. List also have an O(1) insertion time (simply add the element at the end of the list) but have lookup and removal that are O(N): to look up a specific element you need to go through the entire List (consider the case where the element is the last, or worst: not in the list!) and to remove the element, you need first to look it up, then rebuild the list after the removed element.

This blog post attempts to explain the magic behind Python's Dict, by reconstructing it from scratch using only Python code. Most of the information contained in this blog post can be traced back either directly to [cpython source code](https://github.com/python/cpython/blob/main/Objects/dictobject.c) or the two top answers of [How are Python's Built In Dictionaries Implemented?](https://stackoverflow.com/questions/327311/how-are-pythons-built-in-dictionaries-implemented) on StackOverflow.

{{< table-of-content >}}

1. [Introduction](#introduction): we briefly describe a Dict's behavior
1. [Hashing and building the base dict](#hashing-and-building-the-base-dict): we learn how Python's _hash_ function can be used to magically _know_ where things are stored without having to look everywhere
1. [Open Addressing & Tombs](#dealing-with-collisions-open-addressing-and-tombs): we deal with collisions using _open addressing_, a smart search function. We don't forget to use tombs when items are deleted...
1. [Variable size Dict](#variable-size-dict): we dynamically grow our Dict's size, depending on how many items are stored
1. [Memory Efficiency & Dict Ordering](#memory-efficiency-and-dict-ordering): we make the Dict's internal storage memory efficient, and at the same time sort items by insertion order

{{< /table-of-content >}}

## Introduction

From our point of view, a dict is an object which we can populate with values associated to keys. In the following example, we’re linking capital cities to their respective countries:

```python {linenos=inline}
country_to_capital = dict()
country_to_capital['France'] = 'Paris'
country_to_capital['UK'] = 'London'

print(country_to_capital.get('UK'))
>>> 'London'
```

If we'd want to do that with a List, we'd have to do it the hard way

```python {linenos=inline}
country_to_capital = list()
country_to_capital.append(['France', 'Paris'])
country_to_capital.append(['UK', 'London'])

for key, value in country_to_capital:
  if key == 'UK':
    print(value)
    break
```

Dict is practical, but also fast: looking for UK's capital is done at the same speed, no matter the size of our Dict (i.e. the number of country-capital pairs already inserted), contrasting with List where you could possibly end up parsing the entire list (which happens everytime you're looking for something that's not there!).

But how does this work behind the curtains? Well, from the point of view of the [Python FAQ](https://docs.python.org/3/faq/design.html#how-are-dictionaries-implemented-in-cpython) itself, "_CPython’s dictionaries are implemented as **resizable hash tables**_". What does this mean? Let's find out!

## Hashing and building the base dict

When we're looking for a specific key in a List, we're doing extactly that: _looking for it_: we have to parse the List until we find it. And this is why it's O(n). To get to O(1) is pretty intuitive: when we want to look for a key in a List, we need to _know_ where it is, withtout having to look for it at every place.

That's where hash tables come in. Hash tables are Lists that use hashes to _know_ where things are stored. As a quick reminder, Python's _hash_ function can be seen as a function that assigns an integer (called a hash) to any object (let's say a string or an integer), with the property that (almost always) different object will have different hashes. {{< approx id="hash">}}
To be really precise, Python can only assign hashes to _immutable_ objects. These are objects that cannot be changed, such as ints and strings. It doesn't make sense to hash a _mutable_ object, such as a List, because the hash must represent the object very specifically. A mutable object can change at any time, and its hash wouldn't reflect those changes.
{{< /approx >}}

```python {linenos=inline}
print(hash("What's the hash of this sentence??"))
>>> 4343814758193556824

# any int will be equal to its hash
print(hash(12))
>>> 12
```

This can help us achieve the wanted O(1) complexity we're looking for.

The way hash tables are implemented is very simple: instead of starting with an empty List and appending objects arbitrarily one after the other, we start with a List that has enough room already, and place objects at specific locations when they arrive. That way, since each object has a specific location, we can simply search that location to check if it's there or not.

Where do hashes come in? Well, we know the size of our List, let's say `N`, and the object's hash, let's say `h`, is an integer. Simply taking `h mod N` will give us a specific place to look for! In the Python code below, this can be seen at lines 12 and 19. {{< approx id="modulo">}}

Interestingly, when `N` is a power of 2, let's say `N = 2**k`, computing `h mod N` is the same as taking the last `k` binary factors of `h`, which is extra cheap to do!

{{< /approx >}}

```python {linenos=inline}
class PythonDict:
    """
    Our own basic implementation of Python Dict!
    """

    def __init__(self):
        # empty List that will store key-value pairs
        self.storage = [None] * 8

    def add(self, key, value):
        # compute the hash and its modulo
        idx = hash(key) % len(self.storage)

        # Add the key-value pair at that slot
        self.storage[idx] = (key, value)

    def remove(self, key):
        # compute the hash and its modulo
        idx = hash(key) % len(self.storage)

        # remove the key-value pair at that slot
        self.storage[idx] = None

    def __getitem__(self, key):
        """ Magic method used as in `d[key]` """
        idx = hash(key) % len(self.storage)
        value = self.storage[idx]
        if value is None:
            raise KeyError(f'{key=}')
        return value

    def __setitem__(self, key, value):
        """ Magic method used as in `d[key] = value` """
        self.add(key, value)
```

Let’s check that it works:

```python {linenos=inline}
countries_to_capital = PythonDict()
countries_to_capital['France'] = 'Paris'
countries_to_capital['UK'] = 'London'

print(countries_to_capital['UK'])
>>> 'London'
```

Neat, it does work! Or does it?

## Dealing with collisions: Open Addressing and Tombs

You are probably wondering about what happens when two keys have the same hash (not probable), or when their hashes have the same modulo (happens often). We call such situations _collisions_.

```python {linenos=inline}
letters = PythonDict()
letters[1] = 'a'
letters[9] = 'i'

print(letters[1])
>>> 'i'
```

In this case, the above behavior happens because an int is always equal to its hash, leading to `1 mod 8 == 9 mod 8`. In other words, `1` and `9` make us search for them at the same place!

When it comes to collisions, we have two solutions.

- Tired: simply have a list at each place for all the objects with same hash/modulo. This works but then we're back to iterating over the list when there are several objects at the same place. At least, these lists are smaller!
- Wired: find another place. But we can't choose at random: remember that we're trying to be efficient and we must _know_ where things are.

Finding another place is called [Open Addressing](https://en.wikipedia.org/wiki/Open_addressing), and can be done in many ways. The easiest way is simply to try and go directly to the next spot, until we find an empty spot. This is called _linear probing_, and it does works. Unfortunately, it is undesirable to be implemented by default by Python, due to the hash functions already mapping int to themselves. When you're creating a dict from a range of integers, you will already fill spots in your dicts that are contiguous, because when hashes differ by one, so does their modulos!. This can lead to a crowding effect, where large contiguous part of your storage are occupied and linear probing leads back to O(N)!

Python solves this by having emprically found a "good" probing function. This probing function is used to _know_ the correct place for any key-value pairs. Now, because we'll be using this function at different places (for look-up, insertion and removal), we'll make it a method on its own! In the Python code below, the `smart_search` method is implemented at lines 14-50.

To put it briefly, the method first looks at the intuitive spot, `h mod N` at line 30, and if there’s a collision looks for the next spot (at line 47) following this formula:

`next_spot = ((5 x current_spot) + 1) mod N` {{< approx id="probing">}}

In fact, CPython's probing function is a bit more complicated and involves playing around with bits. You can see all details in [the source code](https://github.com/python/cpython/blob/main/Objects/dictobject.c#L191) if you are interested, but I have chosen to keep the simplied version for this post.

{{< /approx >}}

Given a key-value pair and an occupied spot, there are two possibilities for why that spot is already occupied: 1) we already placed the key-value pair here and 2) an other key-value pair was already placed here. To differentiate between the two (it all happens at line 42), we first compare the hashes: they could be different but still lead to the same modulo hence the collision. If they’re the same, we fall back to python `==`method. {{< approx id="check-equality">}}

Checking for equality between keys can actually be arbitrarily costly, depending on the type of keys. In practice, keys are often strings, ints or tuples, for wich equality is fast to check.

{{< /approx >}}

Now we can deal with the insertion and look-up of any object, without worrying about collisions.

```python {linenos=inline}
letters = PythonDict()
letters[1] = 'a'
letters[9] = 'i'

print(letters[1])
>>> 'a'

print(letters[9])
>>> 'i'
```

All good right? Wait a minute, what about removing objects? In fact, we're curently in trouble. Consider the situation from the above snippet: we’ve added a key-value pair `p1` (`1, 'a'`) -- line 2, and then try and add a second pair `p2` (`9, 'i'`) -- line 3 -- that unfortunately collides with `p1`. We use our `smart_search` to find the next good empty spot, and place `p2` there. Good. If we’re to search for `p2` again, no problem: we’ll compute its hash and modulo, see that there is `p1` in its place, reuse the smart_search and eventually arrive a the correct spot -- lines 5-9.

But what if we delete `p1` and _then_ search for `p2`? That's where our troubles come from: since `p1` is not in our storage anymore, `smart_search`'s first guess using `p2`'s computed hash and modulo will find an empty spot (which before collided with `p1)`, and we will simply think that `p2` has never been added -- lines 7-8.

```python {linenos=inline}
letters = PythonDict()
letters[1] = 'a'
letters[9] = 'i'

letters.remove(1)

print(letters[9])
>>> KeyError('key=9')
```

This is why we add _tombs_: everytime we delete an object, we have to remember that it was there at some point, and leave a mark so that smart search knows to skip this spot, and look further. This happens at line 68.

Note that in the below implementation, now we also keep the hash of the keys we store. This is done to avoid recomputing many hashes many times.

```python {linenos=inline}
class PythonDict:
    """
    Our own (less so) basic implementation of Python Dict!
    Now with:
        - smart_search to deal with collisions
    """

    DEADSLOT = '<slot cannot be used>'

    def __init__(self):
        # empty List that will store hash-key-value pairs
        self.storage = [None] * 8

    def smart_search(self, h, key):
        """
        1) We compute <idx> the position in storage using the key's hash
        2) At <idx> in storage, we either find:
            - None: no key with that hash exists
            - a triplet : we have already placed an object at that slot
        3) If we found an triplet at 2), then we compare keys at that position:
            - if not same hash (collision due to modulo): we continue our search
            - if same hash, but not same key (collision due to hash function): we continue our search
            - if same hash and same key: we set exists to True

        RETURNS:
            idx: index of the slot of where to put the object
            exists: whereas object was already there, this is for convenience
        """
        # Computing intial place to store the object
        idx = h % len(self.storage)

        # Deterministic search while there is an object at that position
        while self.storage[idx] is not None:

            collision = self.storage[idx]

            # The collision could be due to a dead slot
            if collision != self.DEADSLOT:

                # comparing hash and key of an occupied slot
                other_h, other_key, _ = collision
                if h == other_h and key == other_key:
                    return idx, True  # True means obj exists already

            # If collision is due to a dead or occupied slot
            # We look for another place with a (simplified) non-linear probing algorithm
            idx = ((5 * idx) + 1) % len(self.storage)

        # At this point, we found an empty slot that we can return
        return idx, False  # False means obj doesn't exist yet

    def add(self, key, value):
        # Computing hash once
        h = hash(key)

        # Find the correct slot for the given key
        idx, exists = self.smart_search(h, key)

        # Add the hash-key-value triplet at that slot
        self.storage[idx] = (h, key, value)

    def remove(self, key):
        # Find the correct slot for the given key
        idx, exists = self.smart_search(hash(key), key)

        # remove the key-value pair at that slot
        # placing a DEADSLOT to avoid breaking self.smart_search
        self.storage[idx] = self.DEADSLOT

    def __getitem__(self, key):
        """ Magic method used as in `d[key]` """
        idx, exists = self.smart_search(h, key)
        if not exists:
            raise KeyError(f'{key=}')
        return self.storage[idx]

    def __setitem__(self, key, value):
        ...
```

## Variable size Dict

Ok, but what about [pigeon holes](https://en.wikipedia.org/wiki/Pigeonhole_principle)? We're starting with an internal storage List of size 8, but Python's Dict should be able to handle more than eight key-value pairs! So what's the trick? The trick is the _resizable_ of _resizable hash tables._ When we're nearing completion of the storage list, we simply rebuild the dict with a bigger initial list (line 53-54). That's it, that's the trick. {{< approx id="resizable">}}

In practice, [the load factor is kept under 2/3](https://github.com/python/cpython/blob/main/Objects/dictobject.c#L164), meaning that the Dict is resized when it is more than 2/3rd full.

{{< /approx >}}

In the following snippet, we only show the method that changed from the previous snippet. Note that we could also resize down when removing too many objects, but this would needlessly obsfucate the code at this stage.

```python {linenos=inline}
class PythonDict:
	"""
	Our own nearly complete implementation of Python Dict!
    Now with:
        - smart_search to deal with collisions
        - dynamic resizing
	"""

    DEADSLOT = '<slot cannot be used>'

    def __init__(self):
        # empty List that will store hash-key-value triplets
        self.storage = [None] * 8

				# Keeping track of objects and deadslots for resizing purposes
        self._len, self._n_dead_slots = 0, 0

    def __len__(self):
        return self._len

    def smart_search(self, h, key):
        ...

    def resize(self, new_size):
        """Resize the internal storage to new_size"""
        # Initialize new storage, keeping the previous one (all our objs are in it!)
        storage, self.storage = self.storage, [None] * new_size

        # Reinitializing _len and _n_dead_slots
        self._len, self._n_dead_slots = 0, 0

        # Re-adding all valid objects
        for obj in storage:
            if obj != self.DEADSLOT:
                h, key, value = obj
                self.add(key, value, h)

    def add(self, key, value, h=None):
        # Computing hash once if needed
        h = hash(key) if h is None else h

        # Find the correct slot for the given key
        idx, exists = self.smart_search(h, key)

        if not exists:

            # Increasing count of existing objects
            self._len += 1

            # Add the hash-key-value triplet at that slot
            self.storage[idx] = (h, key, value)

            # If the number of occupied slot (legit + tombs) is more than 2/3rd
            # we resize the dict.
            if self._len + self._n_dead_slots > (len(self.storage) * 2/3):
                self.resize(len(self.storage) * 2)

        else:
            # We do not increase the count of existing objects
            # simply replace the old value by the newest one
            self.storage[idx] = (h, key, value)


    def remove(self, key):
        # Find the correct slot for the given key
        idx, exists = self.smart_search(hash(key), key)

        if exists:

            # Decreasing count of existing objects
            # and increasing count of dead slots
            self._len -= 1
            self._n_dead_slots += 1

            # remove the key-value pair at that slot
            # placing a DEADSLOT to avoid breaking self.smart_search
            self.storage[idx] = self.DEADSLOT

    def __getitem__(self, key):
        ...

    def __setitem__(self, key, value):
        ...
```

## Memory Efficiency and Dict Ordering

Now we have most of the functionality. We can optimize things further, by noting that we are using an internal storage List consisting of mostly empty spots reserved for future hash-key-value triplets, and that takes a lot of unused space. {{< approx id="bytes">}}

For instance, on a 64 bits (i.e. 8 bytes) architecture, each slot in the dict takes 3x8=24 bytes.

{{< /approx >}}

Instead, Python's Dict simply stores indices that map to a much smaller, compact List. Everything stays the same as before, but now our mostly-empty storage List has slots of size 8 bytes, reducing the amount of unused memory by 3!

Note that now, we can iterate over the compact List, with method `PythonDict.items()`, which gives us all the objects in the dict sorted by insertion order!

Notice that almost all methods have changed this time.

```python {linenos=inline}
class PythonDict:
	"""
	Our own complete implementation of Python Dict!
    Now with:
        - smart_search to deal with collisions
        - dynamic resizing
        - memory efficiency and ordering by insertion order
	"""

    DEADSLOT = '<slot cannot be used>'

    def __init__(self):
        # storage List now only stores index of occupied slots
        self.storage = [None] * 8

        # List that will store actual hash-key-value triplets
        self._items = list()

        # Keeping track of objects and deadslots for resizing purposes
        self._len, self._n_dead_slots = 0, 0

    def __len__(self):
        return self._len

    def items(self):
        """Go through Dict's items in insertion order"""
        for obj in self._items:
            if obj != self.DEADSLOT:
                h, key, value = obj
                yield key, value

    def smart_search(self, h, key):
        """
        1) We compute <idx> the position in index_storage using the hash
        2) At <idx> in index_storage, we either find:
            - None: no key with that hash exists
            - an index: we have to look in storage to know more
        3) If we found an index at 2), then we compare keys at that position:
            - if not same hash (collision due to modulo): we continue our search
            - if same hash, but not same key (collision due to hash function): we continue our search
            - if same hash and same key: we set exists to True


        RETURNS:
            idx: index of the slot of where to put the object
            exists: whereas object was already there, this is for convenience
        """
        # Computing intial place to store the object
        idx = h % len(self.storage)

        # Deterministic search while there is an index at that position
        while self.storage[idx] is not None:

            # fetching the actual object in items
            collision = self._items[self.storage[idx]]

            # The collision could be due to a dead slot
            if collision != self.DEADSLOT:

                # comparing hash and key of an occupied slot
                other_h, other_key, _ = collision
                if h == other_h and key == other_key:
                    return idx, True  # True means obj exists already

            # If collision is due to a dead or occupied slot
            # We look for another place with a (simplified) non-linear probing algorithm
            idx = ((5 * idx) + 1) % len(self.index_storage)

        # At this point, we found an empty slot that we can return
        return idx, False  # False means obj doesn't exist yet

    def resize(self, new_size):
        """Resize the internal storage to new_size"""

        # Initialize new storage (no need to keep the previous one,
        #                         because it contains useless indices)
        self.storage = [None] * new_size

        # Initialize new _items, keeping the previous ones
        _items, self._items = self._items, list()

        # Reinitializing _len and _n_dead_slots
        self._len, self._n_dead_slots = 0, 0

        # Re-adding all valid objects
        for obj in _items:
            if obj != self.DEADSLOT:
                h, key, value = obj
                self.add(key, value, h)

    def add(self, key, value, h=None):
        # Computing hash once if needed
        h = hash(key) if h is None else h

        # Find the correct slot for the given key
        idx, exists = self.smart_search(h, key)

        if not exists:

            # Increasing count of existing objects
            self._len += 1

            # Append the hash-key-value triplet to _items
            # And add the index of newly added object to storage
            self.storage[idx] = len(self._items)
            self._items.append(tuple((h, key, value)))

            if self._len + self._n_dead_slots > (len(self.storage) * 2/3):
                self.resize(len(self.storage) * 2)

    def remove(self, key):
        # Find the correct slot for the given key
        idx, exists = self.smart_search(hash(key), key)

        if exists:

            # Decreasing count of existing objects
            # and increasing count of dead slots
            self._len -= 1
            self._n_dead_slots += 1

            # remove the key-value pair at that slot
            # placing a DEADSLOT to avoid breaking self.smart_search
            # Notice that we don't remove the index, because we keep the deadslot
            self._items[self.storage[idx]] = self.DEADSLOT

    def __getitem__(self, key):
        ...

    def __setitem__(self, key, value):
        ...
```

And voilà, Python's Dict from scratch in pure Python!

### Future improvements:

- **Implement all functionalities**. To obtain a real Python Dict we would need to implement a number of methods. For instance `__contains__()` in order to check if a key has already been added. Or the often used `keys()` and `values()`. We could also create its `__repr__` for pretty printing!
- **Be more efficient with memory**. While we need to keep tombs, we could certainly replace them when adding a new object. As an idea, the `smart_search` method could track the first `DEADSLOT` encountered, and if `exists=False` could then return this index rather than the last one. We could also resize our PythonDict when removing objects!
