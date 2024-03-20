/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  sidebar: [
    {
      type: 'doc',
      id: 'intro',
    },
    {
      type: 'doc',
      id: 'quickstart',
    },
    {
      type: 'doc',
      id: 'examples',
      label: 'Examples',
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        {
          type: 'doc',
          id: 'guides/nx',
          label: 'NX Monorepo',
        },
        {
          type: 'doc',
          id: 'guides/without-backend',
          label: 'Without a Backend',
        },
        {
          type: 'doc',
          id: 'guides/non-ts-clients',
          label: 'Non-TypeScript Clients',
        },
        {
          type: 'doc',
          id: 'guides/fake-apis',
          label: 'Fake APIs for Testing',
        },
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        {
          type: 'autogenerated',
          dirName: 'api/modules',
        },
      ],
    },
    {
      type: 'category',
      label: '@ts-rest/core',
      collapsed: false,
      items: [
        { type: 'doc', id: 'core/core' },
        { type: 'doc', id: 'core/fetch' },
        { type: 'doc', id: 'core/custom' },
        { type: 'doc', id: 'core/infer-types' },
        { type: 'doc', id: 'core/errors' },
        { type: 'doc', id: 'core/form-data' },
      ],
    },
    {
      type: 'doc',
      label: '@ts-rest/react-query',
      id: 'react-query',
    },
    {
      type: 'doc',
      label: '@ts-rest/vue-query',
      id: 'vue-query',
    },
    {
      type: 'category',
      label: '@ts-rest/nest',
      collapsed: false,
      items: [
        { type: 'doc', id: 'nest/nest' },
        { type: 'doc', id: 'nest/legacy' },
        { type: 'doc', id: 'nest/configuration' },
      ],
    },
    {
      type: 'doc',
      label: '@ts-rest/next',
      id: 'next',
    },
    {
      type: 'category',
      label: '@ts-rest/fastify',
      collapsed: false,
      items: [
        { type: 'doc', id: 'fastify/fastify' },
        { type: 'doc', id: 'fastify/openapi' },
      ]
    },
    {
      type: 'category',
      label: '@ts-rest/express',
      collapsed: false,
      items: [
        { type: 'doc', id: 'express/express' },
        { type: 'doc', id: 'express/middleware' },
      ],
    },
    {
      type: 'doc',
      label: '@ts-rest/open-api',
      id: 'open-api',
    },
    {
      type: 'category',
      label: 'Comparisons',
      collapsed: true,
      items: [
        {
          type: 'doc',
          id: 'comparisons/rpc-comparison',
        },
      ],
    },
    {
      type: 'doc',
      label: 'Troubleshoot',
      id: 'troubleshoot',
    },
  ],
};

module.exports = sidebars;
