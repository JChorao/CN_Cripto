const ejs = require('ejs');

const template = `
<!DOCTYPE html>
<html>
<body>
    <script>
        const dataFromDB = <%- (typeof priceData !== 'undefined' && priceData.length > 0) ? JSON.stringify(priceData) : '[]' %>;
    </script>
</body>
</html>
`;

const testCases = [
    { name: 'Valid Data', data: { priceData: [{ id: 1, price: 100 }] } },
    { name: 'Empty Array', data: { priceData: [] } },
    { name: 'Null Data', data: { priceData: null } },
    { name: 'Undefined Data (explicit)', data: { priceData: undefined } },
    { name: 'Missing Data', data: {} }
];

testCases.forEach(test => {
    try {
        const output = ejs.render(template, test.data);
        console.log(`[PASS] ${test.name}`);
        // console.log(output);
    } catch (err) {
        console.error(`[FAIL] ${test.name}:`, err.message);
    }
});
