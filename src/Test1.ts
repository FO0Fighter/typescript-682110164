const utils = require('./utils').utils;

const unit_test =async () => {
    //test case 1 of unit test
    if(utils.add(2,3) === 5) {
        console.log(2)
    } else {
        console.log(1)
        return;
    }
}

unit_test();