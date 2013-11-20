var $ = require('common:widget/ui/jquery/jquery.js');
var helper = require('common:widget/ui/helper/helper.js');
/**
 * 【功能说明】针对目前页面上有很多相同自定义样式的下拉列表散布在多个模块中（因为样式需要自定义，故不能使用原始的select标签，需要用其它标签来模拟一个select），将初始化及此部分的通用事件绑定代码提出来作为一个单独的组件，提供初始化、通用事件（包括下拉列表的显隐、列表项的选择等）、一套通用样式
 * 【使用方法】在页面上添加一个隐藏的select元素，参数至少需要提供一个id，
 * - 如果select里面是空白则下拉内容通过js赋值给data参数来生成（适用于动态内容），如
 *   <select id="#{selector}"></select>
 * - 如果在select内写option则下拉内容直接从页面的option里取（适用于固定内容，option的值和显示名称一样则可以省略value属性），如
 *   <select id="selector">
 * 	    <option value="#{id}">#{name}</option>
 * 	    ...
 *   </select> *
 * 实例化语句如下：
 * var typelist =
 * new Dropdownlist({
 * 		selector: "#{id}",
 *		...
 * })
 * 生成的自定义下拉列表将插在占位select的后面，宽度取决于占位selector的宽度，默认比其宽度少30px
 *
 * @author wangmingfei
 * @constructor
 * @this {Dropdownlist}
 * @param {object} opt 初始化参数，必填
 * {
 * 		selector: {string},	占位元素的id，必填
 * 		data: {array}, 	指定下拉列表的数据，选填
 * 		defIndex: {number}	默认选中项的index，选填，默认是取列表中的第一项即0，如果默认想留空请设置为-1
 * 		visibleNum: {number}	最多可见的行数，选填，多于此数就显示滚动条
 * 		lineHeight: {number}	列表项高度，选填，默认为24，如想覆盖才需要在初始化参数中指定
 * 		supportSubmit: {boolean}	是否支持提交操作，选填，默认为false
 * 		onChange: {function}	select的onChange回调，选填
 * }
 * typelist.value: 返回当前选中的值
 * typelist.reset(data,defIndex): 重置下拉列表内容
 */
var Dropdownlist = function(opt){
	var that = this;
	//占位select的id
	that.selector = opt.selector;
	//占位select的jQuery对象
	that.target = $("#"+that.selector);
	//占位select下的option
	that.options = that.target.find("option");
	//根据是否有option判断数据是固定来源还是动态获取
	that.isDataFixed = that.options.length ? 1 : 0;
	that.hasShown = false;
	//缓存列表数据
	that.data = opt.data || [];
	//记录被选中项的序号
	that.selIndex = that._initSelIndex(opt);
	//下拉列表的宽度根据占位select的宽度决定
	that.targetWidth = that.target.css("width");
	//最多可见的行数，实际数量多于此数就显示滚动条
	that.visibleNum = opt.visibleNum || 5;
	//列表项高度
	that.lineHeight = opt.lineHeight || 24;
	//是否支持表单提交
	that.supportSubmit = opt.supportSubmit || false;
	// select的onChange回调
	that.onChange = opt.onChange;
	//下拉列表的tpl
	that.listTpl = "<span class='ib dropdown dropdown-#{dir}' id='#{targetPrefix}DropDown'><span class='dropdown-trigger'><span class='dropdown-input' id='#{targetPrefix}Picker' readonly='true'#{targetWidth}></span><span class='dropdown-arrow'><i></i></span></span><div class='dropdown-list' id='#{targetPrefix}List'><ul class='dropdown-list-inner'>#{liTpl}</ul></div></span>";
	//初始化
	that._init();
};

//是否已经绑定document事件的标识位
Dropdownlist._hasBindEvent = 0;
//记录当前正在显示的下拉列表
Dropdownlist._curList;

/**
 * 初始化默认选中项的序号，取值规则为先依据默认选中项参数，如果没有，再看是否是isDataFixed固定数据类型并且已经在dom里指定了默认选中项的，如果还是没有则指定为0
 *
 * @this {Dropdownlist}
 * @param {object} opt The init parameter
 * @return {number} the index of list item being selected
 */
Dropdownlist.prototype._initSelIndex = function(opt){
	var that = this,
		tmp;
	if(opt.defIndex){
		tmp = opt.defIndex;
	}else if(that.isDataFixed){
		tmp = that.options.find(":selected").index();
		!(tmp + 1) && (tmp = 0);
	}else{
		tmp = 0;
	}
	return tmp;
};

/**
 * 生成自定义下拉列表
 *
 * @this {Dropdownlist}
 */
Dropdownlist.prototype._initDom = function(){
	var that = this,
		counter = 0;
	// 生成整个下拉列表的html
	that.listTpl = helper.replaceTpl(that.listTpl,{
		dir: conf.dir,
		targetPrefix: that.selector,
		targetWidth: that.targetWidth!=="0px"?" style='width:"+that.targetWidth+"'":"",
		liTpl: that._formLiTpl()
	});
	// 把新生成的下拉列表html包成一个jQuery对象
	that.newSelector = $(that.listTpl);
	// 找到其中的下拉列表
	that.list = that.newSelector.find(".dropdown-list");
	that.innerList = that.list.find(".dropdown-list-inner");
	// 找到其中的输入区域
	that.newInput = that.newSelector.find(".dropdown-input");
	// 插入占位dom的后面
	that.target.after(that.newSelector).hide();
	// 设置默认选中项
	that._setDefaultVal();
	//设置下拉部分的宽度，和input保持一致
	that.list.css("width",that.newInput.outerWidth());
	//设置下拉部分的最大高度，超出部分出滚动条
	that.innerList.css({
		"max-height": that.visibleNum * that.lineHeight,
		"overflow-y": "auto",
		"overflow-x": "hidden"
	});
};

/**
 * 生成下拉列表的所有列表项html
 *
 * @this {Dropdownlist}
 * @return {string} The html of all list items
 */
Dropdownlist.prototype._formLiTpl = function(){
	var that = this,
		html = "";

	// 拼装列表项的html
	$.each(that.data,function(key,value){
		html += "<li value='" + value.id + "' title='"+value.name+"'>" + value.name + "</li>";
	});
	return html;
};

/**
 * 提取非动态数据类型的数据，和动态数据保持一致
 *
 * @this {Dropdownlist}
 */
Dropdownlist.prototype._formData = function(){
	var that = this;
	// 如果是option形式，用来抽取数据
	if(!that.data.length){
		$.each(that.target.find("option"),function(i,v){
			var opt = $(v);
			that.data[that.data.length] = {
				id: opt.attr("value") || opt.html(),
				name: opt.html()
			};
		});
	}
};

/**
 * 设置默认选中项
 *
 * @this {Dropdownlist}
 */
Dropdownlist.prototype._setDefaultVal = function(){
	var that = this,selValue;
	// 如果想默认留空或者数据为空，则输入区为空值；否则输入区显示被选中项的值
	if(that.selIndex === -1 || !that.data.length){
		selValue = {id: "", name:""};
	}else{
		selValue = that.data[that.selIndex];
	}
	// 设置默认选中项
	that.newInput.text(selValue.name).attr({"title":selValue.name,"value":selValue.id});
	that.value = selValue.id;
	// 如果要支持表单提交需要做的工作
	that.supportSubmit && that._prepareSubmit(selValue);
};

/**
 * 让select和自定义下拉列表一起联动
 *
 * @this {Dropdownlist}
 * @param {object} selValue The new data needed to be updated
 */
Dropdownlist.prototype._prepareSubmit = function(selValue){
	var that = this;
	if(that.isDataFixed){
		that.target.find("option").removeAttr("selected").eq(that.selIndex).attr("selected","true");
	}else{
		that.target.html("<option value='"+selValue.id+"' selected='selected'>"+selValue.name+"</option>");
	}
};

/**
 * 重置自定义下拉列表事件
 *
 * @this {Dropdownlist}
 * @param {array} data The new data needed to be updated
 * @param {number} defIndex The default selection index
 */
Dropdownlist.prototype.reset = function(data,defIndex){
	var that = this;
	that.data = data;
	that.selIndex  = defIndex || 0;
	that.innerList.html(that._formLiTpl());
	that._setDefaultVal();
};
/**
 * 绑定自定义下拉列表事件
 *
 * @this {Dropdownlist}
 */
Dropdownlist.prototype._bindEvent = function(){
	var thisObj = this;
	thisObj.newSelector
	//触发下拉列表展开、收起
	.on("click.dropdownlist",".dropdown-trigger",function(e){
		var that = $(this),
			baseOffset = that.offset(),
			listTriggerArrow = that.find(".dropdown-arrow");
		if(thisObj.list.is(":visible")){
			// listTriggerArrow.removeClass("dropdown-arrow-up");
		}else{
			// 下拉展开部分插到body下，避免被祖先元素的任何样式限制（比如说z-index和overflow:hidden都可能导致下拉列表被挡住）
			thisObj.list
			.css({
				left: baseOffset.left,
				top: baseOffset.top + that.outerHeight()
			});
			if(!thisObj.hasShown){
				thisObj.list.appendTo($("body"));
				thisObj.hasShown = true;
			}
			thisObj.list
			.slideDown(200,function(){
				Dropdownlist._curList = thisObj.list;
			});
			// 根据当前被选中项重置默认选中效果和定位显示
			if(thisObj.selIndex >= 0){
				var step = thisObj.selIndex > thisObj.visibleNum ? thisObj.selIndex : 0;
				thisObj.innerList.find("li").removeClass("dropdown-list-hover")
								   .eq(thisObj.selIndex).addClass("dropdown-list-hover");
			  	thisObj.innerList.scrollTop(thisObj.lineHeight * step);
			}
			listTriggerArrow.addClass("dropdown-arrow-up");
		}
	});
	thisObj.list
	// 鼠标进入下拉列表时去掉列表项的选中样式，让样式跟随鼠标移动而变化
	.on("mouseenter.dropdownlist",function(){
		$(this).find(".dropdown-list-hover").removeClass("dropdown-list-hover");
	})
	// 鼠标离开下拉列表时选中样式停留在最后一个停留过的列表项上
	.on("mouseleave.dropdownlist",function(){
		$(this).find("li").eq(thisObj.lastIndex).addClass("dropdown-list-hover");
	})
	// 鼠标离开任意列表项时记录下它的序号，用来帮助上个方法
	.on("mouseleave.dropdownlist","li",function(){
		thisObj.lastIndex = $(this).index();
	})
	//点击下拉列表项
	.on("mousedown.dropdownlist","li",function(){
		var that = $(this),
			newIndex = that.index(),
			newVal = thisObj.data[newIndex];
		if(newVal.id != thisObj.newInput.attr("value")){
			thisObj.selIndex = newIndex;
			thisObj.newInput.text(that.text()).attr({
				"value": newVal.id,
				"title": newVal.name
			});
			thisObj.value = newVal.id;
			thisObj.supportSubmit && thisObj._prepareSubmit(newVal);
			that.addClass("dropdown-list-hover")
				.siblings(".dropdown-list-hover").removeClass("dropdown-list-hover");
			thisObj.onChange && thisObj.onChange.call(that);
		}
	});
	//收起日期列表
	if(!Dropdownlist._hasBindEvent){
		$(document).on("mouseup.dropdownlist", function(e) {
			var el = e.target,
				cur = Dropdownlist._curList;
			// 排除掉下拉列表滚动条的点击，其它都会触发收起
			if(cur && el !== cur.find(".dropdown-list-inner")[0]){
				cur.slideUp(200,function(){
					var parent = $("#"+cur.attr("id").replace(/List$/,"DropDown"));
					// cur.appendTo(parent); // 收起后重新放回原来位置
					parent.find(".dropdown-arrow-up").removeClass("dropdown-arrow-up");
				});
			}
		});
		Dropdownlist._hasBindEvent = 1;
	}
};

/**
 * 初始化自定义下拉列表
 *
 * @this {Dropdownlist}
 * @return {object} Dropdownlist instance
 */
Dropdownlist.prototype._init = function(){
	var that = this;
	that.isDataFixed && that._formData();
	that._initDom();
	that._bindEvent();
	return that;
};

module.exports = Dropdownlist;
