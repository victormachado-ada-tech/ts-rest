import { initClientNew } from '@ts-rest/core';
import type { postsApi } from '@ts-rest/example-microservice/util-posts-api';
import React from 'react';
import { postsClient } from './main';

const experimentalClient = initClientNew<typeof postsApi>({
  baseHeaders: {},
  baseUrl: 'http://localhost:5003',
});

// GET (optional query)
experimentalClient.getPosts('/posts');

// GEt (with query)
experimentalClient.getPosts('/posts', {
  skip: 0,
});

// GET (with params)
experimentalClient.getPost('/posts/:id', { id: '123' });

// POST w/ body
experimentalClient.createPost('/posts', 'POST', {
  title: 'Hello World!',
  content: 'This is a post!',
});

// POST w/ body and multipart/form-data
experimentalClient.updatePostThumbnail(
  '/posts/:id/thumbnail',
  'POST',
  {
    id: '123',
    thumbnail: new File([], 'test.png'),
    data: 'Hey there!',
  },
  {
    contentType: 'multipart/form-data',
  }
);

// DELETE (no body)
experimentalClient.deletePost('/posts/:id', 'DELETE');

export const App = () => {
  const { data } = postsClient.getPosts.useQuery(['posts'], {
    query: {},
  });

  const posts = data?.body || [];

  const [file, setFile] = React.useState<File | null>(null);

  return (
    <div>
      <h1>Posts from posts-service</h1>
      {posts.map((post) => (
        <div key={post.id}>
          <h1>{post.title}</h1>
          <p>{post.content}</p>
          <input
            multiple={false}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={() => {
              if (file) {
                postsClient.updatePostThumbnail.mutation({
                  body: {
                    thumbnail: file,
                    data: 'Hey there!',
                  },
                  params: {
                    id: '1',
                  },
                });
              }
            }}
          >
            Upload
          </button>
        </div>
      ))}
    </div>
  );
};
