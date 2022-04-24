/**
 * @author sgpublic
 * @date 2022.04.24 20:24
 */

/**
 * 从 scheduleHtmlProvider
 * @param str 从 scheduleHtmlProvider 方法中获取到的包含课表信息的 HTML 字符串
 * @returns {[{
 *      name: string,
 *      weeks: number[],
 *      teacher: string,
 *      day: number,
 *      sections: number[],
 *      position: string,
 *  }]}
 */
function scheduleHtmlParser(str) {
    try {
        // 通过 Range 将 string 转换为 DocumentFragment 方便解析（才不会告诉你是没看懂 jQuery）
        const range = document.createRange()
        range.selectNodeContents(document.createElement('tbody'))
        const html = range.createContextualFragment(str)
        return parse(html)
    } catch (e) {
        // 拦截错误，返回空数组
        console.log(e)
        return []
    }
}

/**
 * 解析 HTML 为课表数据<br>
 * name: string 课程名称<br>
 * position: string 上课地点<br>
 * teacher: string 教师名称<br>
 * weeks: number[] 周数<br>
 * day: number 星期几<br>
 * sections: number[] 节次<br>
 * @param html
 * @returns {[{
 *      name: string,
 *      position: string,
 *      teacher: string,
 *      weeks: number[],
 *      day: number,
 *      sections: number[],
 *  }]}
 */
function parse(html) {
    // 用于删除调课等干扰解析的信息
    const classInfoPattern = /<font color="red">(.*?)<\/font>/g

    let result = []

    // tr 为行
    let trs = html.querySelectorAll('tr')
    // 第 2, 4, 6 ... 2n 行为第 1, 2, 3 ... n 大节
    for (let trIndex = 2; trIndex < trs.length; trIndex += 2) {
        // td 为列,
        const tds = trs[trIndex].querySelectorAll('td')
        const tdIndexVar = tds.length - 8
        for (let tdIndex = 0; tdIndex < tds.length; tdIndex++) {
            const classInfo = tds[tdIndex].innerHTML
                .replace("\n", "")
            // 若当前坐标内未包含 <br> 字符串，则代表当前坐标不包含课程信息
            if (classInfo.indexOf('<br>') < 0) continue
            // 一个坐标可能包含多个课程信息，使用 <br><br><br> 分割后分别解析
            const singleClass = classInfo
                .replaceAll(classInfoPattern, "")
                .split('<br><br><br>')
            for (let singleIndex = 0; singleIndex < singleClass.length; singleIndex++){
                const singleData = singleClass[singleIndex].split("<br>")
                const single = { weeks: [], sections: [] }
                single.name = singleData[0]
                const weeks = singleData[1]
                    .substring(0, singleData[1].indexOf('('))
                    .split(',')
                for (let weeksIndex = 0; weeksIndex < weeks.length; weeksIndex++) {
                    const week = weeks[weeksIndex]
                    const range = week.replace("单", "")
                        .replace("双", "")
                        .split('-')
                    let localRange
                    if (range.length === 1) {
                        localRange = [ Number(range[0]), Number(range[0]) ]
                    } else {
                        localRange = [ Number(range[0]), Number(range[1]) ]
                    }
                    for (let rangeIndex = localRange[0]; rangeIndex <= localRange[1]; rangeIndex++) {
                        const index = rangeIndex % 2 === 0
                        // 判断单双周
                        if ((range.indexOf("双") >= 0 && !index)
                            || ((range.indexOf("单") >= 0) && index)) {
                            continue
                        }
                        single.weeks = single.weeks.concat(rangeIndex)
                    }
                }
                single.teacher = singleData[2]
                single.position = singleData[3]
                single.day = tdIndex - tdIndexVar
                single.sections = [ trIndex - 1, trIndex ]

                result = result.concat(single)
            }
        }
    }

    return result
}