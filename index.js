const express = require('express');
const axios = require('axios');
const uuid = require('uuid');

const app = express();

// if your req.body is undefined, you need this line
app.use(express.json());

// if your req.body is always {} even though you did send a body, you need this line
app.use(express.urlencoded({ extended: false }));

const POKE_API = 'https://pokeapi.co/api/v2';

let team = [];

const getPokemon = async (idOrName) => {
  // get or post or put or delete
  const {data} = await axios.get(`${POKE_API}/pokemon/${idOrName}`);

  return data;
};

app.get('/pokemon/:idOrName', async (req, res, next) => {
  const { idOrName } = req.params;

  // whenever you have `await`, make sure you `try/catch`
  try {
    const pokemonData = await getPokemon(idOrName);
    res.send(`
      <html>
        <body>
          <img src=${pokemonData.sprites.front_default} />
          <p>ID: ${pokemonData.id}</p>
          <p>Name: ${pokemonData.name}</p>
        </body>
      </html>
    `)
  } catch (error) {
    res.send(`
      <html>
        <body>
          <h1>${idOrName} is not found</h1>
        </body>
      </html>
    `);
  }
})

// caughtPokemon is an array of id or name
const addToTeam = async (caughtPokemon) => {
  for (let i = 0; i < caughtPokemon.length; i++) {
    if (team.length === 3) {
      return {
        message: 'Team is full',
        currentTeam: team,
      };
    }

    const idOrName = caughtPokemon[i];
    const pokemonData = await getPokemon(idOrName);

    team.push({
      id: pokemonData.id,
      name: pokemonData.name,
      img: pokemonData.sprites.front_default,
      teamPokemonId: uuid.v4(),
    });
  }

  return team;
};

// in post routes, the data you're 'posting' is always gonna be in req.body
app.post('/catch', async (req, res, next) => {
  const { caughtPokemon } = req.body;

  try {
    const team = await addToTeam(caughtPokemon);

    res.send(team);
  } catch (error) {
    res.send({
      message: 'A pokemon you have entered is not found',
    });
  }
});

// the point of this route is to replace the entire team
app.put('/catch', async (req, res, next) => {
  team = [];

  const { caughtPokemon } = req.body;

  try {
    const team = await addToTeam(caughtPokemon);

    res.send(team);
  } catch (error) {
    res.send({
      message: 'A pokemon you have entered is not found',
    });
  }
});

// this deletes a pokemon from our array `team`
app.delete('/release/:teamPokemonId', (req, res, next) => {
  const { teamPokemonId } = req.params;

  team = team.filter(pokemon => pokemon.teamPokemonId !== teamPokemonId);

  res.send(team);
});

app.get('/team', (req, res) => {
  res.send(team);
});

app.listen(3000);
