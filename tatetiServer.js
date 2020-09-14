const WebSocket = require('ws')
var fs = require('fs');
const { exec } = require("child_process");
const request = require('request')

const wss = new WebSocket.Server({ port: 8080 })

const partidas = {}

const nuevaPartida = (primerJugador, codigo) => ({primerJugador: primerJugador, codigo: codigo })

const nuevoCodigo = () => Math.random().toString(36).slice(2, 6).toUpperCase()

agregarJugador = (partida, jugador) => {
  partida.segundoJugador = jugador
}

const crearNuevaPartida = (primerJugador) => {
  const partida = nuevaPartida(primerJugador, nuevoCodigo())
  partidas[partida.codigo] = partida
  return partida
}

const enviar = cliente => mensaje => cliente && cliente.send(JSON.stringify(mensaje))

wss.on('connection', ws => {
  ws.on('message', packet => {
    const message = JSON.parse(packet.toString())
    if(message.accion == "create") {
      const nuevaPartida = crearNuevaPartida(ws)
      enviar(ws)({accion: 'create', codigo: nuevaPartida.codigo})
      console.log(partidas)
    } else if(message.accion == "join") {
      if(partidas[message.codigo]) {
        const partida = partidas[message.codigo]
        agregarJugador(partida, ws)
        enviar(ws)({accion: 'join', tablero: partida.tablero, codigo: message.codigo})
      } else {
        enviar(ws)({error: "Partida no encontrada"})
      }
    } else if(message.accion == "actualizarTablero") {
      const partida = partidas[message.codigo]
      console.log(`Jugado en ${message.tablero}`)
      partida.tablero = message.tablero
      partida.jugadorActual = message.jugadorActual
      const actualizacion = ({accion: 'actualizarTablero', tablero: partida.tablero, jugadorActual: partida.jugadorActual})
      if(ws == partida.primerJugador) {
        enviar(partida.segundoJugador)(actualizacion)
      } else if(ws == partida.segundoJugador) {
        enviar(partida.primerJugador)(actualizacion)
      }
    } else if (message.accion == "pedirTablero") {
      const partida = partidas[message.codigo]
      const actualizacion = ({accion: 'actualizarTablero', tablero: partida.tablero, jugadorActual: partida.jugadorActual})
      enviar(ws)(actualizacion)
    }
  })
})
