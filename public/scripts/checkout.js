var displayError = document.getElementById('card-errors');

function errorHandler(err) {
    changeLoadingState(false);
    displayError.textContent = err;
}


var orderData = {
    items: [{ id: "yelpcamp-registration-fee" }],
    currency: "usd",
    description: "YelpCamp Registration Fee",
    name: 'Jenny Rosen',
    address: {
        line1: '510 Townsend St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94103',
        country: 'US', // Must be a non-IN ISO code
    },
    shipping: {
        name: 'Jenny Rosen',
        address: {
        line1: '510 Townsend St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94103',
        country: 'US', // Must be a non-IN ISO code
        },
    },
};


// Set your publishable key: remember to change this to your live publishable key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
var stripe = Stripe('pk_test_51H2DqkDPQrk2tesaLTaPcm6R2EFvhPojT3L3aLP6lTXr0GCEfoxkc6yPWic2uT4FxXyNEKVShxnKYOxxim65tfve007AcZZONl');
var elements = stripe.elements();

// Set up Stripe.js and Elements to use in checkout form
var style = {
    base: {
        color: "#32325d",
    }
};

var card = elements.create("card", { style: style });
card.mount("#card-element");

card.on('change', function (event) {
    if (event.error) {
        errorHandler(event.error.message)
    } else {
        errorHandler('')
    }
});

var form = document.getElementById('payment-form');

form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    changeLoadingState(true);

    // Collects card details and creates a PaymentMethod
    stripe
        .createPaymentMethod("card", card)
        .then(function (result) {
            if (result.error) {
                errorHandler(result.error.message)

            } else {
                orderData.paymentMethodId = result.paymentMethod.id;

                return fetch("/pay", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(orderData)
                });
            }
        })
        .then(function (result) {
            return result.json();
        })
        .then(function (response) {
            if (response.error) {
                errorHandler(response.error)

            } else {
                changeLoadingState(false);
                // redirect to /campgrounds with a success flash
                window.location.href = '/campgrounds?paid=true'
            }
        }).catch(function (err) {
            errorHandler(err.message)

        });


});


// Show a spinner on payment submission
function changeLoadingState(isLoading) {
    if (isLoading) {
      document.querySelector("button").disabled = true;
      document.querySelector("#spinner").classList.remove("hidden");
      document.querySelector("#button-text").classList.add("hidden");
    } else {
      document.querySelector("button").disabled = false;
      document.querySelector("#spinner").classList.add("hidden");
      document.querySelector("#button-text").classList.remove("hidden");
    }
}
