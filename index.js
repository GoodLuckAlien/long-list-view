import ListContext from './list'
Component({
    properties:{
        /* 列表数据 */
        renderList:{
            type:Array,
            value:[],
            observer(newValue,oldValue){
                /* 监听外层列表数据变化 */
                this.list && this.list.observer(newValue,oldValue)
            }
        },
        /* 纵向滚动 */
        scrollY:{
            type:Boolean,
            value:false
        },
        /* 横向滚动 */
        scrollX:{
            type:Boolean,
            value:false
        },
        /* 距顶部/左边多远时，触发 scrolltoupper 事件  */
        upperThreshold:{
            type:Number,
            value:50
        },
        /* 距底部/右边多远时，触发 scrolltolower 事件 */
        lowerThreshold:{
            type:Number,
            value:50
        },
        style:{
            type:String,
            value:''
        },
        /* 容器高度 */
        containerHeight:{
            type:Number,
            value:500
        }
    },
    data:{
        groupList:[],
        containerId: 'list'
    },
    lifetimes: {
        /* 不需要渲染的数据，直接绑定在实例上面 */
        ready() {
            this.list = new ListContext(this,this.data.containerId)
            setTimeout(()=>{
                this.queryVisibilityItem()
            },1000)
        }
    },
    methods:{
        /* 处理 | 转发 scrolltoupper 事件 */
        _handleScrolltoupper(e){
            this.triggerEvent('scrolltoupper',e)
        },
        /* 处理 | 转发 scroll 事件 */
        _handleScroll(e){
            this.triggerEvent('scroll',e)
        },
        /* 私有方法: 处理 | 转发 Scrolltolower 事件  */
        _bindleScrolltolower(e){
            this.triggerEvent('scrolltolower',e)
        },
        /* 滑动到指定位置 */
        scrollToIndex(index){
            this.list.scrollToIndex(index)
        },
        /* 查询可见的元素 */
        queryVisibilityItem(){
            return new Promise((resolve)=>{
                this.list.queryVisibilityItem(resolve)
            })
        }
    },
})