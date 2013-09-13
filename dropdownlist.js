var $ = require('common:jquery');
var helper = require('common:helper');
/**
 * 自定义下拉列表：在页面上添加一个隐藏的占位dom元素，可以但并不只限于使用<select>，如下
 * <select #{selector}>
 * 	  <option>a</option>
 * 	  ...
 * </select>
 * 在js中实例化new Dropdownlist(param,...)，
 * 下拉内容支持直接从页面的option里取（适用于固定内容）和通过js传值给data参数（适用于动态内容）
 * 根据指定的参数生成一个自定义下拉列表插在占位dom的前面
 * 
 * @author wangmingfei
 * @constructor
 * @this {Dropdownlist}
 * @param {string} selector 占位元素的选择符，必填
 * @param {object} data 指定下拉列表的数据，选填
 * @param {string} defVal 默认选中的值，选填，默认是取列表中的第一项
 */
var Dropdownlist = function(selector,data,defVal){
	var that = this;
	that.selector = selector;
	that.data = data;
	that.defVal = defVal;
	that.target = $(that.selector);
	that.targetPrefix = that.selector.replace(/Select$/,"").slice(1);
	that.targetWidth = that.target.css("width");	
	that.listTpl = "<span class='ib dropdown dropdown-#{dir}'><span class='dropdown-trigger'><input type='text' class='dropdown-input' id='#{targetPrefix}Picker' readonly='true'#{targetWidth}/><span class='dropdown-arrow'><i></i></span></span><div class='dropdown-list' id='#{targetPrefix}List'><ul>#{liTpl}</ul><i class='scroll-arrow top-arrow' href='#'></i><i class='scroll-arrow bottom-arrow' href='#'></i></div></span>";
	that.init();
};

/**
 * 生成自定义下拉列表
 *  
 * @this {Dropdownlist}
 */
Dropdownlist.prototype.formDropdownlist = function(){
	var that = this,
		html = "",
		counter = 0,
		newSelector,
		newInput;
	if(that.data){ // 如果有data参数，根据data参数生成下拉内容
		$.each(that.data,function(key,value){
			html += "<li val='" + key + "'>" + value + "</li>";
		});
		/*for(var i=0,len=that.data.length;i<len;i++){
			html += "<li val='"+that.data[i].value+"'>" + that.data[i].key + "</li>";
		}*/
	}
	html += that.target.html().replace(/option/gi,"li"); // 如果占位dom中有option，把option替换成li
	
	that.listTpl = helper.replaceTpl(that.listTpl,{ // 生成整个下拉列表的html
		dir: conf.dir,
		targetPrefix: that.targetPrefix,
		targetWidth: that.targetWidth?" style='width:"+that.targetWidth+"'":"",
		liTpl: html
	});			
	newSelector = $(that.listTpl); // 把新生成的下拉列表html包成一个jQuery对象
	newInput = newSelector.find(".dropdown-input"); // 找到其中的input
	that.target.after(newSelector).hide(); // 插入占位dom的后面	
	that.defVal = that.defVal || $("li","#"+that.targetPrefix+"List").eq(0).html();
	newInput.val(that.defVal).attr("title",that.defVal); // 设置默认选中项
	newSelector.find(".dropdown-list").css("width",newInput.outerWidth()); //设置下拉部分的宽度，和input保持一致
};

/**
 * 绑定自定义下拉列表事件
 *  
 * @this {Dropdownlist}
 */
Dropdownlist.prototype.bindDropdownlist = function(){
	//触发下拉列表展开、收起	
	$(".dropdown").on("click",".dropdown-trigger",function(){
		var that = $(this),			
			listTriggerArrow = that.find("dropdown-arrow"),
			list = that.siblings(".dropdown-list");
		if(list.is(":visible")){
			list.slideUp(200);
			listTriggerArrow.removeClass("dropdown-arrow-up");
		}else{
			list.slideDown(200);
			listTriggerArrow.addClass("dropdown-arrow-up");					
		}
	});	
	//点击下拉列表项
	$(".dropdown-list").on("mousedown","li",function(){
		var that = $(this),
			newVal = that.attr("val"),					
			thatInput = that.parents(".dropdown").find(".dropdown-input");				
		if(newVal != thatInput.attr("val")){
			thatInput.val(that.text()).attr({
				"val": newVal,
				"title": that.text()
			});
		}				
	});
	//收起日期列表
	$(document).on("mousedown", function(e) {
		var el = e.target;
		$(".dropdown-list").each(function(){
			var cur = $(this),
				curTrigger = cur.siblings(".dropdown-trigger")[0];
			if(cur.is(":visible") && el !== curTrigger && !$.contains(curTrigger, el) && el !== cur.find("ul")[0] && el !== cur.find(".scroll-arrow")[0] && el !== cur.find(".scroll-arrow")[1]){
				cur.slideUp(200);
			}
		});
	});
	/*下拉列表滚动条事件(暂时先不加)
	var topArrow = $(that.selector+" .top-arrow"),
		bottomArrow = $(that.selector+" .bottom-arrow");

	topArrow.addClass("disabled");
	bottomArrow.removeClass("disabled");
	topArrow.click(function(event){
		var thisList = $(this).siblings("ul");
		thisList.scrollTop(thisList.scrollTop()-24);				
		event.preventDefault();
	});
	bottomArrow.click(function(event){
		var thisList = $(this).siblings("ul");
		thisList.scrollTop(thisList.scrollTop()+24);				
		event.preventDefault();
	});
	$(".mod-pray #citylist ul").scroll(function(e){
		var thisObj = $(this);
		thisObj.scrollTop() == 0 ?
			topArrow.addClass("disabled"):
			topArrow.removeClass("disabled");
		(thisObj.height() + thisObj.scrollTop() == thisObj.find("li:first-child").height() * thisObj.find("li").length) ?
			function(){
				bottomArrow.addClass("disabled");						
			}():
			bottomArrow.removeClass("disabled");
	});*/
};

/**
 * 初始化自定义下拉列表
 *  
 * @this {Dropdownlist}
 */
Dropdownlist.prototype.init = function(){
	var that = this;
	that.formDropdownlist();
	that.bindDropdownlist();
};

exports = Dropdownlist;