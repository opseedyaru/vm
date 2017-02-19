'use strict'

const Hapi = require('hapi')
const Inert = require('inert')

const Server = new Hapi.Server()

Server.connection({ port: process.env.PORT || 3000 })

Server.register(Inert, (err) => {
  if (err) throw err

  Server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply.file('./public/images/Xervo_Logo_W559.png')
    }
  })
})

Server.start((err) => {
  if (err) throw err
  console.log(`Server running at: ${Server.info.uri}`)
})
