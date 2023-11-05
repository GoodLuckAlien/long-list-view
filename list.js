class ListContext {
    constructor(instance,containerId) {
        /* 保存整个列表数据 */
        this.wholeList = []
        /* 下一次的分组所以 */
        this.nextGroupIndex = 0
        /* 判断是否有正在进行的任务队列 */
        this.isRenderTask = false
        /* 更新队列 */
        this.renderPendingQueue = []
        /* 高度列表 */
        this.groupHeightArr = []
        /* 保存组件实例 */
        this.instance = instance
        /* 屏幕可视区域高度，设置为容器的高度 */
        this.winHeight = instance.data.containerHeight
        /* 这里面记录了每一个分组到底是渲染的内容，还是占位内容 */
        this.statusArr = []
        this.containerId = containerId
        /* 记录 item 数量 */
        this.itemIndex = -1
        /* 进行初始化的关联 */
        this.observer(this.instance.data.renderList,[])
    }
    /* 查询可见元素 */
    queryVisibilityItem(callback){
        const itemVisibilityObserver = wx.createIntersectionObserver(this.instance,{
            observeAll: true
        })
        const result = []
        itemVisibilityObserver.relativeTo(`#${this.containerId}`)
        .observe(`#${this.containerId} >>> .list-item`, (res) => {
          if(res.intersectionRatio > 0) result.push(res.dataset.index)
        })
        setTimeout(()=>{
            callback(result)
            itemVisibilityObserver.disconnect()
        },50)
    }
    scrollToIndex() { }
    /* 更新待渲染对列 */
    runRenderTask() {
        if (this.renderPendingQueue.length === 0 || this.isRenderTask) return
        const current = this.renderPendingQueue.shift()
        this.isRenderTask = true
        typeof current === 'function' && current()
    }
    /* 处理数据 */
    setList(val) {
        this.wholeList[this.nextGroupIndex] = val
        
        this.instance.setData(
            {   /* 给 val 转载真正的 index */
                [`groupList[${this.nextGroupIndex}]`]: val.map((item)=>{
                    item.itemIndex = ++this.itemIndex
                    return item
                }),
            },
            () => {
                this.statusArr[this.nextGroupIndex] = true
                this.setHeight(this.nextGroupIndex);
                this.nextGroupIndex++;
            }
        );
    }
    /* 设置高度 */
    setHeight(groupIndex) {
        const query = wx.createSelectorQuery().in(this.instance);
        query && query
            .select(`#wrp_${groupIndex}`)
            .boundingClientRect((res) => {
                this.groupHeightArr[groupIndex] = res.height
            })
            .exec();
        this.observeGroup(groupIndex);
    }
    /* 监听列表元素 */
    observer(newList,oldList) {
        if (newList.length && newList.length > 0) {
            const cloneVal = newList.slice();
            /* 找到新增的元素 */
            cloneVal.splice(0, oldList.length);
            /* 创建一个任务 */
            const task = () => {
                this.setList(cloneVal);
            };
            this.renderPendingQueue.push(task);
            this.runRenderTask();
        }else if(Array.isArray(newList) && newList.length === 0){
            /* 清空状态 */
            this.statusArr = []
            this.itemIndex = -1
            this.wholeList = []
            this.nextGroupIndex = 0
            this.isRenderTask = false
            this.renderPendingQueue = []
            this.groupHeightArr = []
            /* 清空视图 */
            this.instance.setData({
                groupList:[]
            })
        }
    }
    /* 创建监听者，监听元素滚动 */
    observeGroup(groupIndex) {
        wx.createIntersectionObserver(this.instance)
            .relativeToViewport({
                top: this.winHeight,
                bottom: this.winHeight,
            })
            .observe(`#wrp_${groupIndex}`, (res) => {
                const nowWholeList = this.wholeList[groupIndex];
                let currentRenderGrounp = null
                let visible = false
                /* 元素在目标区域内消失 */
                if (res.intersectionRatio <= 0) {
                    const listViewHeightArr = [];
                    /* 这里计算一下每一个 item 的平均高度 */
                    const listViewItemHeight = this.groupHeightArr[groupIndex] / nowWholeList.length;
                    for (let i = 0; i < nowWholeList.length; i++) {
                        listViewHeightArr.push({ listViewItemHeight });
                    }
                    /* 占位 */
                    currentRenderGrounp = listViewHeightArr;
                } else {
                    currentRenderGrounp = this.wholeList[groupIndex];
                    visible = true
                }
                /* 拿出上一次分组的状态 */
                const status = !!this.statusArr[groupIndex]
                console.log(status,visible)
                /* 如果状态不一致那么发生更新 */
                if(status !== visible) {
                    this.instance.setData({
                        [`groupList[${groupIndex}]`]: currentRenderGrounp,
                    }, () => {
                        this.isRenderTask = false;
                        /* 渲染下一个分组 */
                        this.runRenderTask();
                        /* 改变状态 */
                        this.statusArr[groupIndex] = visible
                        console.log(this.statusArr)
                    });
                }else{
                    /* 渲染下一个分组 */
                    this.runRenderTask();
                    this.isRenderTask = false;
                }
            });
    }
}

export default ListContext