const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const knex = require('knex');
app.use(bodyParser.json());
app.use(cors());

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        port : 5432,
        user : 'postgres',
        password : 'bolacha2',
        database : 'recognize'
    }
})

db.select('*').from('users').then(data => {
    console.log(data);
});

app.get('/', (req, res) => {
    db.select('*').from('users').then(data => {
        res.send(data);
    })
})

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('incorret form submit')
    }
    db.select('email', 'hasg').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hasg);
            if (isValid) {
                return db.select('*').from('users')
                .where('email', '=', req.body.email)
                .then(user => {
                    res.json(user[0])
                })
            } 
        })
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('incorret form submit')
    }
    const hash = bcrypt.hashSync(password);
      db.transaction(trx => {
        trx.insert({
          hasg: hash,
          email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx('users')
            .returning('*')
            .insert({
              email: loginEmail[0],
              name: name,
              joined: new Date()
            })
            .then(user => {
              res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
      })
      .catch(err => res.status(400).json(err))
  })

app.get('/profile/:id',(req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({id}).then(user => {
        if (user.length) {
            res.json(user[0])
        } else {
            res.status(400).json('Not found')
        }
    })
    .catch(res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0])
    })
    // .catch(res.status(400).json('unable to get entries'))
} )

app.listen(3000, ()=> {
    console.log('app is running on port 3000');
})

