import chalk from 'chalk'

const log = console.log
const pad = num => ''.padStart(num ?? 0)

function padText(str, padding) {
  return str
    .split('\n')
    .reduce(
      (acc, curr, i) => acc + (i > 0 ? '\n' : '') + pad(padding) + curr,
      ''
    )
}

export function hardWrap(str, printwidth) {
  if (!str) return str
  const words = str.split(' ')

  let currLen = 0
  let result = ''
  // Iterate over words in string
  for (let i = 0; i < words.length; i++) {
    const word = words[i]

    // Split word if it's too long to fit on one line. Place parts of the
    // word on each line, as much as will fit.
    if (word.length > printwidth) {
      for (let j = 0; j < Math.floor(printwidth / word.length); j++) {
        result +=
          '\n' + word.substring(j, Math.min(j + printwidth, word.length))
      }
      currLen = word.length % printwidth
    }

    // Add word to result string, adding a newline before it if it's too long.
    // Add 1 to the length to account for the space that needs to be placed
    // before the word
    else if (currLen + word.length + 1 > printwidth) {
      result += '\n' + word
      currLen = word.length
    }

    // In this case, there is enough space for the word on this line. Just
    // add a space and the word to this line
    else {
      if (i > 0) {
        result += ' '
      }
      result += word
      currLen += 1 + word.length
    }
  }

  return result
}

const isNarrow = num => (num ?? process.stdout.columns) < 24
const isReallyNarrow = num => (num ?? process.stdout.columns) < 16

function msg(str, level = 'info', title) {
  // Genereate log level badge

  const time = new Date().toLocaleTimeString().match(/^[0-9:]+/)[0]
  let line1 = ''
  const cols = process.stdout.columns

  if (level == 'ok') {
    line1 += chalk.black.bgGreen('  OK  ')
  } else if (level == 'warn') {
    line1 += chalk.black.bgYellow(' WARN ')
  } else if (level == 'error') {
    line1 += chalk.black.bgRed(' ERR  ')
  } else {
    line1 += chalk.black.bgBlue(' INFO ')
  }

  // Print header with title

  title = title || ''
  const width = cols - 1 - time.length - 1 - 6

  if (isNarrow(width)) {
    log(line1 + time.padStart(cols - 6))
    log(
      padText(
        hardWrap(chalk.bold(title), cols - (isReallyNarrow(width) ? 4 : 0)),
        isReallyNarrow(width) ? 0 : 2
      )
    )
    log()
  } else {
    const titleLines = hardWrap(title, width).split('\n')
    log(
      line1 +
      ' ' +
      chalk.bold(titleLines[0]) +
      time.padStart(cols - 7 - titleLines[0].length)
    )
    titleLines.splice(0, 1)
    titleLines.forEach(l => log(pad(7) + chalk.bold(l)))
  }
  log()

  // Print body

  if (str) {
    log(padText(hardWrap(str, cols - 4), 2))
  }
}

function printDetail(a) {
  if (!a) return
  console.log(a.location)

  // Adjust the line to highlight part if it (if necessary) and add elipses (if
  // necessary)

  const cols = process.stdout.columns
  let lineTxt = a.location.lineText
  let lineTextLength = lineTxt.length
  /** Avalible width for printing lineText */
  const availWidth = cols - 2 - 5 - 2 - 1 - 2
  const { file, line, column, length } = a.location
  let offset = 0
  let trimmedFromLeft = 0

  // Colorize the error, if applicable
  if (length) {
    lineTxt =
      lineTxt.substring(0, column, column) +
      chalk.green(lineTxt.substring(column, column + length)) +
      lineTxt.substring(column + length)

    // subtract chalk's escape codes from the column number
    offset += chalk.green('j').length - 1
  }

  // concatenate line of code that has an error
  if (column > availWidth - 8) {
    // The amount of characters to draw on either side of the highlighted error
    const spacing = (availWidth - 6) / 2
    lineTxt =
      '...' +
      lineTxt.substring(
        column - Math.floor(spacing),
        column + offset + Math.ceil(spacing)
      ) +
      '...'
    trimmedFromLeft = column - Math.floor(spacing) - 3
  } else if (lineTextLength > availWidth) {
    lineTxt = lineTxt.substring(0, availWidth - 3 + offset) + '...'
  }

  // Log the preview of the line
  log(`  ${file}:${line}:${column}:`)
  log(`  ${line.toString().padStart(5)} │ ${lineTxt}`)
  log(
    `  ${pad(5)} ╵ ${pad(column - trimmedFromLeft)}${chalk.green(
      '^'.padEnd(length || 1, '^')
    )}`
  )

  // Print suggestion, if any
  if (a.suggestion) {
    log()
    log(a.suggestion)
  }

  // Print notes at the bottom
  if (a.notes && a.notes.length) {
    if (isNarrow()) {
      a.notes.forEach(n => {
        log()
        log(hardWrap(n.text, cols))
      })
    } else {
      a.notes.forEach(n => {
        log()
        log(padText(hardWrap(n.text, cols - 4), 2))
      })
    }
  }

  log()
}

function printError(e) {
  msg('', 'error', e.text)
  if (e.location) printDetail(e)
}
function printWarning(e) {
  msg('', 'warn', e.text)
  if (e.location) printDetail(e)
}

function handleBuildDone(buildStatus, isRebuild = false) {
  console.clear()

  const success = () =>
    msg(
      '',
      'ok',
      `${isRebuild ? 'Rebuilt' : 'Built'} src/index.ts with ${buildStatus?.warnings?.length || 0
      } warning(s)`
    )

  if (!buildStatus) {
    success()
    return
  }

  const hasErr = buildStatus.errors && buildStatus.errors.length
  const hasWarn = buildStatus.warnings && buildStatus.warnings.length
  if (hasErr) {
    buildStatus.errors.forEach(e => printError(e))
  }
  if (hasWarn) {
    buildStatus.warnings.forEach(e => printWarning(e))
  }

  if (hasErr) {
    msg(
      '',
      'error',
      (isRebuild ? 'Rebuild' : 'Build') +
      ` of src/index.ts failed with ${buildStatus.errors.length} error(s) and ${buildStatus.warnings.length} warning(s)`
    )
  } else {
    success()
  }
}

export { handleBuildDone }
