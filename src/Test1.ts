const utils = require('./utils').utils;

const unit_test =async () => {
    //test case 1 of unit test
    if(utils.add(2,2) === 4) {
    } else {
        console.log("Test Case1: utils.add(2,2) === 4")
        process.exit(1);
    }

    if (utils.add(3,3) === 6) {
    } else {
        console.log("Test Case 2: utils.add(3,3) === 6")
        process.exit(1);
    }
}

unit_test();