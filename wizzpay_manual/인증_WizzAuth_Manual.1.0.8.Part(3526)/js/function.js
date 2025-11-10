function include(FileDir) {
    var includejs = document.createElement("script");
    
    includejs.type = "text/javascript";
    includejs.src = FileDir;
    
    document.head.appendChild(includejs);
}

include("./js/aes.js");
include("./js/pbkdf2.js");

function WizzpayISP(wizz_url, mid, iv_key, salt, password) {
	if(!(this instanceof WizzpayISP)) {
		console.error("WizzpayError: " + "please create object.");
		return new Object();
	}

	this.DEBUG = false;
	this.IS_ADD_EVNET = false;
	
	this.RESULT_FUNCTION = null;
	this.RESULT_DATA = null;
	this.REQUEST_URL = "/pay/api/auth/common/Ready.jsp";
	this.BLOCK_CARD_COMPANIES = [''];
	
	if(wizz_url == undefined
		|| mid == undefined
		|| iv_key == undefined
		|| salt == undefined
		|| password == undefined)
	{
		console.error("WizzpayError: " + "required parameter is not enough.");
		return new Object();
	}
	
	this.WIZZ_URL = wizz_url;
	this.MID = mid;
	this.IV_KEY = iv_key;
	this.SALT = salt;
	this.PASSWORD = password;
};

WizzpayISP.prototype.goPay = function(merchantFormName) {
	let _self = this;
	if(merchantFormName == null || merchantFormName == "") {
		this.errorLog("form name is empty or null.");
		return false;
	}
	else if(document.getElementsByName(merchantFormName).length != 1) {
		this.errorLog("this form is not unique.");
		return false;
	}
	
	
	let merchantForm = document.getElementsByName(merchantFormName)[0];

	if(merchantForm.GOODSNAME == undefined		|| merchantForm.GOODSNAME.value == ""
		|| merchantForm.AMT == undefined		|| merchantForm.AMT.value == ""
		|| merchantForm.BUYERNAME == undefined	|| merchantForm.BUYERNAME.value == "")
	{
		if((merchantForm.RESULTURL == undefined || merchantForm.RESULTURL.value == "")
			&& typeof(this.RESULT_FUNCTION) == 'function' ) {
			this.errorLog("required value is not enough.");
			return false;
		}
	}

	let data = new Object();
	data.goodsname   = merchantForm.GOODSNAME.value.substring(0,20);
	data.amt         = merchantForm.AMT.value;
	data.buyername   = merchantForm.BUYERNAME.value;
	(merchantForm.RESULTURL != undefined) ? data.resulturl = merchantForm.RESULTURL.value : data.resulturl = "";
	(merchantForm.NOTIURL != undefined)	? data.notiurl = merchantForm.NOTIURL.value : data.notiurl = "";
	(merchantForm.BYPASSVALUE != undefined) ? data.bypassvalue = merchantForm.BYPASSVALUE.value : data.bypassvalue = "";
	
	let popupName = "payTest";
	window.open("about:blank", popupName, "left=50, top=50, width=710px, height=510px, toolbar=no, scrollbars=no, status=no, resizable=no");
	
	let requestForm = document.createElement("form");
	requestForm.appendChild(this.createHiddenInputDOM("MID", this.MID));
	requestForm.appendChild(this.createHiddenInputDOM("DATA", this.toEncrypt(JSON.stringify(data))));
	requestForm.appendChild(this.createHiddenInputDOM("BLOCK_CARD_COMPANIES", this.BLOCK_CARD_COMPANIES));
	
	requestForm.action = this.WIZZ_URL + this.REQUEST_URL;
	requestForm.target = popupName;
	requestForm.method = "post";
	
	document.body.appendChild(requestForm);
	requestForm.submit();
	
	if(this.IS_ADD_EVNET === false) {
		this.IS_ADD_EVNET = true;
		window.addEventListener("message", function(e) {
			if(e.data.RETURNCODE == "0000" || e.data.RETURNCODE == "3001") {
				_self.RESULT_DATA = e.data;
				if(merchantForm.RESULTURL != undefined && merchantForm.RESULTURL.value != "" && merchantForm.RESULTURL.value.length > 0) {
					let resultForm = document.createElement("form");
					resultForm.action = e.data.RESULT_URL;
					requestForm.method = "post";
					
					resultForm.appendChild(_self.createHiddenInputDOM("RETURNCODE", e.data.RETURNCODE));
					resultForm.appendChild(_self.createHiddenInputDOM("RETURNMSG", e.data.RETURNMSG));
					resultForm.appendChild(_self.createHiddenInputDOM("TID", e.data.TID));
					resultForm.appendChild(_self.createHiddenInputDOM("CARDAUTHNO", e.data.CARDAUTHNO));
					resultForm.appendChild(_self.createHiddenInputDOM("ORDERID", e.data.ORDERID));
					resultForm.appendChild(_self.createHiddenInputDOM("GOODSNAME", e.data.GOODSNAME));
					resultForm.appendChild(_self.createHiddenInputDOM("AMT", e.data.AMT));
					resultForm.appendChild(_self.createHiddenInputDOM("TRANDATE", e.data.TRANDATE));
					resultForm.appendChild(_self.createHiddenInputDOM("CARDCODE", e.data.CARDCODE));
					resultForm.appendChild(_self.createHiddenInputDOM("CARDNAME", e.data.CARDNAME));
					resultForm.appendChild(_self.createHiddenInputDOM("CARDNO", e.data.CARDNO));
					resultForm.appendChild(_self.createHiddenInputDOM("QUOTA", e.data.QUOTA));
					resultForm.appendChild(_self.createHiddenInputDOM("BYPASSVALUE", e.data.BYPASSVALUE));
					  
					document.body.appendChild(resultForm);
					resultForm.submit();
				}else if(typeof(_self.RESULT_FUNCTION) == 'function') {
					_self.RESULT_FUNCTION();
				} else {
					this.errorLog("'RESULTURL' and 'RESULT_FUNCTION' invalid value");
				}
		    } else if(e.data.resultCode === "cancel") {
		    	alert("결제가 취소 되었습니다.");
		    }
		});
	}

	return true;
}

WizzpayISP.prototype.setResultFunction = function(userResultFunction) {
	if(typeof(userResultFunction) == 'function') {
		this.RESULT_FUNCTION = userResultFunction;
		return true;
	} else {
		this.log("parameter is not defined as 'function'.");
		return false;
	}
}

WizzpayISP.prototype.getResultData = function() {
	return this.RESULT_DATA;
}

WizzpayISP.prototype.setDebugMode = function(debugMode) {
	if(debugMode == true) {
		this.DEBUG = true;
	} else if(debugMode == false) {
		this.DEBUG = false;
	}
}

WizzpayISP.prototype.createHiddenInputDOM = function(name, value) {
	let inputDom = document.createElement("input");
	inputDom.setAttribute("type", "hidden");
	inputDom.setAttribute("name", name);
	inputDom.setAttribute("value", value);
    
    return inputDom;
}

WizzpayISP.prototype.setBlockCardCompany = function(cardCompanycode) {
	this.BLOCK_CARD_COMPANIES.push(cardCompanycode);
}

WizzpayISP.prototype.toEncrypt = function(data) {
    let key128Bits100Iterations = CryptoJS.PBKDF2(this.PASSWORD, CryptoJS.enc.Hex.parse(this.SALT), { keySize: 128/32, iterations: 1000 });

    return CryptoJS.AES.encrypt(data, key128Bits100Iterations, { iv: CryptoJS.enc.Hex.parse(this.IV_KEY) });
}

WizzpayISP.prototype.log = function(message) {
	if(this.DEBUG)  console.log(message);
}

WizzpayISP.prototype.errorLog = function(message) {
	console.error("WizzpayError: " + message);
}
