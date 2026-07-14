const getHeaders = (t: any) => [
    { title: t('table.fake_data.id') as string, key: 'id', get_type: "string" },
    { title: t('table.fake_data.name') as string, key: 'name', get_type: "string" },
    { title: t('table.fake_data.value') as string, key: 'value', get_type: "string" },
];

export default function (t: any) {
    return {
        title: t('table.fake_data.title') as string,
        headers: getHeaders(t),
        path_base: '/api/v0.1/app/fake_data',
        features: [],
        readOnMount: true
    }
}

// A stub route exists to service this Table.  Exclude it from a real build.
// export default defineNuxtConfig({
// extends: ['./my-shared-layer'], // Your layer
// Exclude specific files merged from your layer
// ignore: [
//     'pages/example-route.vue',         // Matches a single file
//     'pages/example-folder/**'          // Matches a whole directory
// ]
// })