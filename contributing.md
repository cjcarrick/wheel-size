## Scraping

### Fitment Industries

Paste this into the developer console:

```javascript
let titleCase = str =>
  str.replaceAll(/(?:^|-)(\w)/g, (m, char) => ' ' + char.toUpperCase())

let kebabCase = str => str.toLowerCase().replace(/[^0-9a-z]/g, '-')

let sanitize = str => str.trim().replace(/ +/g, ' ')
```

And then paste this into the console on each page of the search results:

```javascript
$('.galad-container')
  .toArray()
  .map(el => {
    const staggered = !!$(el)
      .find('#galad-ymm-title .store-ymm-small')
      ?.text()
      ?.match(/staggered/i)

    const vehicle = $(el).find('[alt]').attr('alt').split(' - ')[0]

    const tire = sanitize($(el).find('#tire .galad-specs-large').text())
    const wheel = sanitize($(el).find('#wheel .galad-specs-large').text())

    const tireBrands = $('#list-params[data-type="tire_brand"] li')
      .toArray()
      .map(a => sanitize($(a).text()))
    const tireMake = tire.match(new RegExp(tireBrands.join('|')))[0]
    const tireModel = tire.replace(new RegExp(tireBrands.join('|')), '').trim()

    // Assume that only the first word of the tire's name is the model. This
    // won't be correct all of the time, but it's close enough mosst of the time.
    const wheelBrands = $('#list-params[data-type="wheel_brand"] li')
      .toArray()
      .map(a => sanitize($(a).text()))
    const wheelMake = wheel.match(new RegExp(wheelBrands.join('|')))[0]
    const wheelModel = wheel
      .replace(new RegExp(wheelBrands.join('|')), '')
      .trim()

    const link = $(el).find('[href]').attr('href')

    const suspension = titleCase(
      link.match(
        new RegExp(
          kebabCase(sanitize(vehicle.replace(' — Staggered', ''))) +
            '-' +
            kebabCase(wheel) +
            '-(.*?)-' +
            kebabCase(tire)
        )
      )[1]
    )

    let response = {
      source: 'Fitment Industries',
      images: [$(el).find('img').attr('src')],
      link,
      description: sanitize($(el).find('#galad-ymm-title').text()),
      suspension,
      ride_height: 0
    }

    if (staggered) {
      let [frontWheel, rearWheel] = sanitize(
        $(el).find('#wheel .galad-specs-small').text()
      )
        .replace(/Front: |Rear: /g, '')
        .split('—')

      let [frontTire, rearTire] = sanitize(
        $(el).find('#tire .galad-specs-small').text()
      )
        .replace(/Front: |Rear: /g, '')
        .split('—')

      let [frontTireWidth, frontAspect] = sanitize(frontTire).split(/\/|R/)
      frontTireWidth = parseFloat(frontTireWidth)
      frontAspect = parseFloat(frontAspect)

      let [rearTireWidth, rearAspect] = sanitize(rearTire).split(/\/|R/)
      rearTireWidth = parseFloat(rearTireWidth)
      rearAspect = parseFloat(frontAspect)

      let [frontDiameter, frontWheelWidth, frontOffset] =
        sanitize(frontWheel).split(/x| |mm/)
      frontDiameter = parseFloat(frontDiameter)
      frontWheelWidth = parseFloat(frontWheelWidth)
      frontOffset = parseFloat(frontOffset)

      let [rearDiameter, rearWheelWidth, rearOffset] =
        sanitize(rearWheel).split(/x| |mm/)
      rearDiameter = parseFloat(rearDiameter)
      rearWheelWidth = parseFloat(rearWheelWidth)
      rearOffset = parseFloat(rearOffset)

      response.wheel = {
        front: {
          diameter: frontDiameter,
          width: frontWheelWidth,
          offset: frontOffset,
          make: wheelMake,
          model: wheelModel
        },
        back: {
          diameter: rearDiameter,
          width: rearWheelWidth,
          offset: rearOffset,
          make: wheelMake,
          model: wheelModel
        }
      }

      response.tire = {
        front: {
          width: frontTireWidth,
          aspect: frontAspect,
          make: tireMake,
          model: tireModel
        },
        back: {
          width: rearTireWidth,
          aspect: rearAspect,
          make: tireMake,
          model: tireModel
        }
      }
    } else {
      let [diameter, wheelWidth, offset] = sanitize(
        $(el).find('#wheel .galad-specs-small').text()
      ).split(/x| |mm/)
      diameter = parseFloat(diameter)
      wheelWidth = parseFloat(wheelWidth)
      offset = parseFloat(offset)

      let [tireWidth, aspect] = sanitize(
        $(el).find('#tire .galad-specs-small').text()
      ).split(/\/|R/)
      tireWidth = parseFloat(tireWidth)
      aspect = parseFloat(aspect)

      response.wheel = {
        diameter,
        width: wheelWidth,
        offset,
        make: wheelMake,
        model: wheelModel
      }
      response.tire = {
        width: tireWidth,
        aspect,
        make: tireMake,
        model: tireModel
      }
    }

    return response
  })
```
