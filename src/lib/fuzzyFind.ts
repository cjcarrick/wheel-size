export type TriggerOptions = {
  triggerWord: string
  completionItems: string[] | (() => string[])
}

export default class fuzzyFind {
  results: {
    /** value is doesn't include any trigger words */
    value: string
    /** fullvalue includes trigger words */
    fullValue: string
    /** the slices of `value` that were matched */
    matches: {
      start: number
      /** this bound is exclusive */
      end: number
    }[]
  }[] = []

  triggers?: {
    [trigger: string]: TriggerOptions['completionItems']
  }
  private _sort: boolean

  constructor(
    public _query: string,
    public _completionItems: string[],

    options?: {
      withTriggers?: TriggerOptions[]
      sortResults?: boolean
    }
  ) {
    // Populate initial results
    this.setQuery(this._query)

    this._sort = options?.sortResults ?? true
    this.triggers = options?.withTriggers?.reduce<
      Record<string, TriggerOptions['completionItems']>
    >((prev, curr) => {
      prev[curr.triggerWord] = curr.completionItems
      return prev
    }, {})
  }

  /**
   * Sets a new query value and recalculates results
   *
   * @returns the new results
   */
  public setQuery(
    newQuery: string | ((oldQuery: string, items: string[]) => string)
  ) {
    if (typeof newQuery == 'function') {
      newQuery = newQuery(this._query, this._completionItems)
    }

    this._query = newQuery

    // By default, we'll search through the default completion items
    let items = this._completionItems
    let usedTrigger = ''

    // If a trigger was triggered, we'll use those items instead
    if (this.triggers) {
      findTrigger: for (let trigger of Object.keys(this.triggers)) {
        const matchedTrigger = newQuery.match(new RegExp(`^${trigger}`))

        if (matchedTrigger) {
          this._query = newQuery.replace(new RegExp(`^${trigger}`), '')

          const a = this.triggers[trigger]
          if (Array.isArray(a)) {
            items = a
          } else {
            items = a()
          }

          usedTrigger = trigger
          break findTrigger
        }
      }
    }

    // If the new query is an empty string, just put every completion item in
    // the results. This allows the user to see all the results when nothing is
    // entered and saves on performance.
    if (this._query == '') {
      this.results = items.map(value => ({
        fullValue: usedTrigger + value,
        value,
        matches: []
      }))
    }

    // Otherwise, reset the results and manually filter them again
    else {
      this.results = []

      for (const item of items) {
        const matches = this.matches(item, this._query)
        if (matches?.length) {
          this.results.push({
            value: item,
            matches,
            fullValue: usedTrigger + item
          })
        } else {
          this.results.push({
            value: item,
            matches: [{ start: 0, end: 0 }],
            fullValue: usedTrigger + item
          })
        }
      }

      // Results are sorted with the best matches first
      if (this._sort)
        this.results.sort(
          (a, b) =>
            //
            // sort based on the longest consecutive matches. Eg:
            //
            // >> query: uc
            //
            // Should give this order
            //
            // >> trUCk
            //    UnderCarriage
            //
            Math.max(...b.matches.map(c => c.end - c.start)) -
            Math.max(...a.matches.map(c => c.end - c.start)) ||
            //
            // Then sort by whichever matched first. Eg:
            //
            // >> query: tr
            //
            // Should give this order:
            //
            // >> TRuck
            //    fireTRuck
            //
            a.matches[0].start - b.matches[0].start ||
            //
            // Then just sort alphabetically
            //
            a.value.localeCompare(b.value)
        )
    }
  }

  /** The real fuzzy matching search. Returns the matches or undefined if there
   * are none. */
  private matches<T extends string>(item: T, query: string) {
    const split = item.split('')
    let startOfItem = 0
    const result: {
      /** 0-based index of the start of this match */
      start: number
      /** 0-based index of the end of this match. Always at least one greater
       * than the start. */
      end: number
    }[] = []

    // Smart case: only do a case sensitive match if the user entered a capital
    // letter
    const caseSensitive = query.match(/[A-Z]/)!!

    // Iterate over each character of the query
    for (let queryChar of query) {
      let index = split
        .slice(startOfItem)
        .findIndex(itemChar =>
          caseSensitive
            ? itemChar == queryChar
            : itemChar.toUpperCase() == queryChar.toUpperCase()
        )

      // There are no more matches in this item
      if (index == -1) {
        return undefined
      }

      // We found a match
      index += startOfItem

      // Check if this match is a continuation of the last one
      const lastMatch = result[result.length - 1]
      if (lastMatch?.end == index) {
        lastMatch.end++
      } else {
        result.push({ start: index, end: index + 1 })
      }

      // Begin the next search from this index
      startOfItem = index + 1
    }

    // If we made it this far, double check that there are matches
    return result.length ? result : undefined
  }

  public slicedResults() {
    let response: { text: string; matched: boolean }[][] = []

    // Iterate through results
    for (const result of this.results) {
      // Basically, the indices represent points in the string where the string
      // changes from being matched to unmatched...
      let indices = result.matches.flatMap(match => [match.start, match.end])

      if (indices.length == 0) {
        response.push([{ text: result.value, matched: false }])
        continue
      }

      const slice: { text: string; matched: boolean }[] = []

      // This is useful later
      const startAtMatch = indices[0] == 0 ? 1 : 0

      // Ensure that the first index is the index of the first character of the
      // string
      if (indices[0] !== 0) {
        indices.unshift(0)
      }

      // Ensure that the final index is the index of the final character of the
      // string
      if (indices[indices.length - 1] !== result.value.length) {
        indices.push(result.value.length)
      }

      for (let i = 0; i < indices.length - 1; i++) {
        slice.push({
          // ...the slice is determined by the bounds of indices[i] and the next
          // number, indices[i + 1]
          text: result.value.slice(indices[i], indices[i + 1]),

          // ...and whether or not i is even can determine if this slice is part of
          // the string is a match or not
          matched: (startAtMatch + i) % 2 == 1
        })
      }

      response.push(slice)
    }

    return response
  }
}
