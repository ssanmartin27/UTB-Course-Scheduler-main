const express = require('express')
const cors = require('cors')
const axios = require("axios");
const Banner = require('./banner')
const app = express()
const banner = new Banner('utb')
app.use(cors())
app.use(express.static('build'))


app.get('/:method/*', (request, response) => {
    const method = request.params.method
    const paramsArray = !request.params[0]? [] : request.params[0].split('/')
    if (paramsArray.length < banner[method].length) {
        response.status(400).end()
    }

    else {
        try {
            banner[method](...paramsArray).then(res => response.json(res)) 
        }
        catch {
            response.status(404).end()
        }''
    }

})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})