const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

// Schéma GraphQL
const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    usersByName(name: String!): [User]
    post(id: ID!): Post
    posts: [Post]
  }

  type Mutation {
    addPost(
      title: String!, 
      content: String!, 
      authorId: ID!
    ): Post
    addComment(
      postId: ID!,
      authorId: ID!,
      content: String!
    ): Comment
    likePost(postId: ID!, userId: ID!): Post
    followUser(followerId: ID!, followeeId: ID!): User
  }

  type User {
    id: ID!
    name: String
    email: String
    posts: [Post]
    followers: [User]
    following: [User]
  }

  type Post {
    id: ID!
    title: String
    content: String
    author: User
    likes: Int
    comments: [Comment]
  }

  type Comment {
    id: ID!
    content: String
    author: User
  }
`);

// Données simulées
const users = [
  { id: "0", name: 'Alice', email: 'alice@example.com', followers: [], following: [] },
  { id: "1", name: 'Bob', email: 'bob@example.com', followers: [], following: [] }
];

const posts = [
  { id: "0", title: 'Alice', content: 'Contenu pour Alice', author: "0", likes: 0, comments: [] }
];

const comments = [];

// Résolveurs
const root = {
  user: ({ id }) => {
    const user = users.find(user => user.id === id);
    if (user) {
      user.posts = posts.filter(post => post.author === user.id);
      user.followers = users.filter(u => u.following.includes(user.id));
      user.following = users.filter(u => user.following.includes(u.id));
    }
    return user;
  },

  usersByName: ({ name }) => {
    return users.filter(user => user.name.toLowerCase().includes(name.toLowerCase()));
  },

  post: ({ id }) => {
    const post = posts.find(post => post.id === id);
    if (post) {
      post.author = users.find(user => user.id === post.author);
    }
    return post;
  },

  posts: () => {
    return posts.map(post => {
      return {
        ...post,
        author: users.find(user => user.id === post.author)
      };
    });
  },

  addPost: ({ title, content, authorId }) => {
    const newPost = { id: String(posts.length + 1), title, content, author: authorId, likes: 0, comments: [] };
    posts.push(newPost);
    return newPost;
  },

  addComment: ({ postId, authorId, content }) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post non trouvé');
    const newComment = { id: String(comments.length + 1), content, author: users.find(user => user.id === authorId) };
    post.comments.push(newComment);
    comments.push(newComment);
    return newComment;
  },

  likePost: ({ postId, userId }) => {
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post non trouvé');
    post.likes += 1;
    return post;
  },

  followUser: ({ followerId, followeeId }) => {
    const follower = users.find(user => user.id === followerId);
    const followee = users.find(user => user.id === followeeId);
    if (!follower || !followee) throw new Error('Utilisateur non trouvé');
    if (!follower.following.includes(followeeId)) {
      follower.following.push(followeeId);
      followee.followers.push(followerId);
    }
    return followee;
  }
};

// Création du serveur Express
const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

// Lancement du serveur
app.listen(4000, () => console.log('Serveur GraphQL lancé sur http://localhost:4000/graphql'));
