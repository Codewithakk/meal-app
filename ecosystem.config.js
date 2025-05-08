module.exports = {
    apps: [
        {
            name: 'backend',
            script: 'dist/index.js',
            instances: '1',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
}
