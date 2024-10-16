module.exports = function Cart(oldCart) {

    // Row 4-9 takes in old cart we then assign value of the old cart.
    this.items = oldCart.items || {};
    //store quanitity:
    this.totalQty = oldCart.totalQty || 0;
    //total price of items:
    this.totalPrice = oldCart.totalPrice || 0;

    this.individualItemPrice = oldCart.individualItemPrice || 0;

    // Function to add new item to cart
    this.add = function (item, id) {

        // store item
        let storedItem = this.items[id];

        //check if item/item group already exist in card if not create a new one.
        if (!storedItem) {
            storedItem = this.items[id] = {
                item: item,
                qty: 0,
                price: 0,
            };
        }
        //Increase quantity of item.
        storedItem.qty++;
        //Calculation to adjust the price.
        storedItem.price = storedItem.item.price * storedItem.qty;
    

        //Total quanitity of price.
        this.individualItemPrice = storedItem.item.price;
        this.totalQty++;
        this.totalPrice += storedItem.item.price;

    }

    

    //Function to reduce by one
    this.reduceByOne = function (id) {
        if (this.items[id]) {
            this.items[id].qty--;
            this.items[id].price -= this.items[id].item.price;
            this.totalQty--;
            this.totalPrice -= this.items[id].item.price;

            if (this.items[id].qty <= 0) {
                delete this.items[id];
            }
        } else
            console.log('“item does not exist”')
    }

    //Increase quantity with one.
    this.increaseByOne = function (id) {
        try {
            if (this.items[id]) {
                this.items[id].qty++;
                this.items[id].price += this.items[id].item.price;
                this.totalQty++;
                this.totalPrice += this.items[id].item.price;

                // testa senare 
                if (this.items[id].qty >= 10) {
                    false;
                }

            } else
                console.log('“item does not exist”')
        } catch (e) {
            console.log('too much')
        }
    }

    // Fcuntion to remove an item from cart.
    this.removeItem = function (id) {
        this.totalQty -= this.items[id].qty;
        // The adjusted total price
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
    }

    // Function it will give us cart items as an array 
    //output list of product group
    this.generateArray = function () {
        let arr = [];
        for (let id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    }
};