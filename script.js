// Helper / Utility functions
let url_to_head = (url) => {
  return new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    script.src = url;
    script.onload = function () {
      resolve();
    };
    script.onerror = function () {
      reject("Error loading script.");
    };
    document.head.appendChild(script);
  });
};
let handle_close = (event) => {
  event.target.closest(".ms-alert").remove();
};
let handle_click = (event) => {
  if (event.target.classList.contains("ms-close")) {
    handle_close(event);
  }
};
document.addEventListener("click", handle_click);
const paypal_sdk_url = "https://www.paypal.com/sdk/js";
const client_id =
  "ASt-pqyIdFMz7-icoBlG2EU0Zx1w6FOQVQ-wbm4mt8HZxXMEM7AiLKCAKKt3Hb4v0xGKPJmM6SCamc3M";
const currency = "USD";
const intent = "capture";
let alerts = document.getElementById("alerts");

//PayPal Code
//https://developer.paypal.com/sdk/js/configuration/#link-queryparameters
url_to_head(
  paypal_sdk_url +
    "?client-id=" +
    client_id +
    "&enable-funding=venmo&currency=" +
    currency +
    "&intent=" +
    intent
)
  .then(() => {
    //Handle loading spinner
    document.getElementById("loading").classList.add("hide");
    document.getElementById("content").classList.remove("hide");
    let alerts = document.getElementById("alerts");
    let paypal_buttons = paypal.Buttons({
      // https://developer.paypal.com/sdk/js/reference
      onClick: (data) => {
        // https://developer.paypal.com/sdk/js/reference/#link-oninitonclick
      },
      style: {
        //https://developer.paypal.com/sdk/js/reference/#link-style
        shape: "rect",
        color: "gold",
        layout: "vertical",
        label: "paypal",
      },

      createOrder: function (data, actions) {
        //https://developer.paypal.com/docs/api/orders/v2/#orders_create
        return fetch("/create_order", {
          method: "post",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ intent: intent }),
        })
          .then((response) => response.json())
          .then((order) => {
            return order.id;
          });
      },

      onApprove: function (data, actions) {
        let order_id = data.orderID;
        return fetch("/complete_order", {
          method: "post",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            intent: intent,
            order_id: order_id,
          }),
        })
          .then((response) => response.json())
          .then((order_details) => {
            console.log(order_details); //https://developer.paypal.com/docs/api/orders/v2/#orders_capture!c=201&path=create_time&t=response
            let intent_object =
              intent === "authorize" ? "authorizations" : "captures";
            //Custom Successful Message
            alerts.innerHTML =
              `<div class=\'ms-alert ms-action\'>Thank you ` +
              order_details.payer.name.given_name +
              ` ` +
              order_details.payer.name.surname +
              ` for your payment of ` +
              order_details.purchase_units[0].payments[intent_object][0].amount
                .value +
              ` ` +
              order_details.purchase_units[0].payments[intent_object][0].amount
                .currency_code +
              `!</div>`;
            email = document.getElementById("email").value;
            // 支付成功后发送生成报告请求
            console.log(question, card1, card2, card3,email);
            sendGetRequest(question, card1, card2, card3, email);
            //Close out the PayPal buttons that were rendered
            paypal_buttons.close();
          })
          .catch((error) => {
            console.log(error);
            alerts.innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>An Error Ocurred!</p></div>`;
          });
      },

      onCancel: function (data) {
        alerts.innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>Order cancelled!</p></div>`;
      },

      onError: function (err) {
        console.log(err);
      },
    });

    paypal_buttons.render("#payment_options");
  })
  .catch((error) => {
    console.error(error);
  });

function sendGetRequest(question, card1, card2, card3, email) {
  // 构建GET请求URL
  const url = `http://tarotmaster.pakqoostudio.com:5000/make_report/${question}/${card1}/${card2}/${card3}/${email}`;

  // 使用fetch发送GET请求
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let alerts = document.getElementById("alerts");
      alerts.innerHTML = `<div class="ms-alert ms-action "><p>Thank you for choosing our service! We have received your request. The page will automatically redirect to the previous page in 10 seconds, or you can manually click <a href="http://tarotmaster.pakqoostudio.com">here</a> for redirection.</p></div>`;
      var timerId = window.setTimeout(() => {
        window.location.href = "http://tarotmaster.pakqoostudio.com";
        clearTimeout(timerId);
      }, 10000);
    })
    .catch((error) => {
      // 处理错误
      console.error("There was a problem with the fetch operation:", error);
    });
}

var question = "";
var card1 = "";
var card2 = "";
var card3 = "";
var email = "";

// 跨页面传参
document.addEventListener("DOMContentLoaded", function () {
  // 打印 URL 中的查询参数
  console.log(window.location.search);
  // 获取从streamlit过来的参数
  const urlParams = new URLSearchParams(window.location.search);
  question = urlParams.get("question");
  var parametersElement = document.getElementById("question");
  parametersElement.placeholder = question;

  card1 = urlParams.get("card1");
  var parametersElement = document.getElementById("card1");
  parametersElement.placeholder = "Card1: " + card1;

  card2 = urlParams.get("card2");
  var parametersElement = document.getElementById("card2");
  parametersElement.placeholder = "Card2: " + card2;

  card3 = urlParams.get("card3");
  var parametersElement = document.getElementById("card3");
  parametersElement.placeholder = "Card3: " + card3;

  email = urlParams.get("email");
});

// 邮箱格式检查
function validateEmail() {
  // 获取输入的电子邮件地址
  var email = document.getElementById("email").value;

  // 正则表达式用于验证电子邮件地址的格式
  var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

  // 检查电子邮件地址是否匹配正则表达式
  if (emailRegex.test(email)) {
    // 如果格式有效，显示成功消息
    document.getElementById("result").textContent = "Valid email address";
    return true;
  } else {
    // 如果格式无效，显示错误消息
    document.getElementById("result").textContent = "Invalid email address";
    return false;
  }
}
