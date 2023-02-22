export class SliderWithValue {
  slider: HTMLInputElement
  numeric: HTMLInputElement

  val: number
  min: number
  max: number

  locked: boolean
  stepAmount: number

  listeners: ((newValue: number, oldValue: number) => void)[]

  constructor(
    parentSelector: string

    // private options?: {
    //   labelGenerator?: (val: number) => string
    // }
  ) {
    // Find the required elements

    this.slider = document.querySelector(
      `${parentSelector} input[type='range']`
    ) as HTMLInputElement

    this.numeric = document.querySelector(
      `${parentSelector} input[type='number']`
    ) as HTMLInputElement

    this.numeric.value = this.slider.value

    if (!this.slider) {
      throw new Error(`Could not find input slider in ${parentSelector}`)
    }

    if (!this.numeric) {
      throw new Error(`Could not find numeric input in ${parentSelector}`)
    }

    this.slider.addEventListener('input', () => {
      this.numeric.value = this.slider.value
    })
    this.numeric.addEventListener('change', () => {
      this.slider.value = this.numeric.value
    })

    this.min = parseInt(this.slider.getAttribute('min') || '0')
    this.max = parseInt(this.slider.getAttribute('max') || '0')

    this.stepAmount = parseFloat(this.slider.getAttribute('step') ?? '0')

    const lock = document.querySelector(
      `${parentSelector} .lock`
    ) as HTMLInputElement
    const snap = document.querySelector(
      `${parentSelector} .snap`
    ) as HTMLInputElement

    // Create DOM listeners
    this.slider.addEventListener('input', this.update)

    lock.addEventListener('input', () => {
      this.locked = this.slider.disabled = lock.checked
    })

    snap.addEventListener('input', () => {
      const stepped = snap.checked
      if (stepped) {
        this.slider.setAttribute('step', this.stepAmount.toString())
      } else {
        this.slider.setAttribute('step', '0.01')
      }
    })

    // Initiate 0 callbacks
    this.listeners = []

    // Draws initial values. It's ok to do this now because there aren't any
    // listeners yet
    this.setValue(parseFloat(this.slider.value))
  }

  setValue = (newVal: number) => {
    if (this.locked) {
      console.warn('Attempted to set value, but slider is locked.')
      return
    }
    this.val = newVal
    this.slider.value = newVal.toString()
    this.numeric.value = newVal.toString()
    this.update()
  }

  update = () => {
    // Save the old value
    const oldValue = this.val

    // Update the stored value
    this.val = parseFloat(this.slider.value)

    // // Update the label
    // if (this.options?.labelGenerator) {
    //   this.label.innerHTML = this.options.labelGenerator(this.val)
    // } else {
    //   this.label.innerHTML = this.val.toString()
    // }

    // Fire listeners
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](this.val, oldValue)
    }
  }

  // Allows for registering of listeners
  onchange = (cb: (newValue: number, oldValue: number) => void) => {
    this.listeners.push(cb)
  }
}
