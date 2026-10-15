import React from 'react';
import { BookOpen, Award, Heart, ChevronRight, MessageSquare, X } from 'lucide-react';

/* --- 🎨 风格常量 --- */
const THEME = {
  bg: "bg-stone-50",
  sidebar: "bg-gray-900",
  card: "bg-white border border-gray-200 shadow-sm",
};

/* --- 7. 📘 知识详情页面 --- */
const KnowledgeDetailPage = ({ itemId, onNavigate }) => {
  // 假设的详细数据源
  const DATA = {
    "宗师源流": {
      title: "宗师源流：太极拳的起源与传承",
      icon: <BookOpen size={24} />,
      content: "太极拳的起源众说纷纭，主流观点认为其由明末清初河南温县陈家沟的陈王廷创编。陈王廷出身武学世家，曾任职武官，辞官归隐后，他融合戚继光《纪效新书・拳经捷要》中的拳法精髓，吸纳道家导引吐纳之术，又以《周易》太极阴阳理念为核心，创编出一套刚柔并济、虚实相生的拳法，这套拳法最初在陈家沟内部传承，是后世太极拳的雏形。另一说法则将太极拳源头追溯至元末明初武当山的张三丰真人，认为他观察自然万物姿态，结合道家内丹养生与内家拳理，创编了太极拳。但这一说法更多流传于民间与武当武术流派中，缺乏直接的史料佐证，史学界多将其视为附会于宗师的传奇传说。流派则追溯至武当山张三丰真人，但缺乏直接史料佐证。",
      // 💥 修改 DATA 结构，新增详细 sections 数组
      sections: [
        {
          id: "origin", title: "起源传说与争议", text: "深入探讨太极拳 '武当派张三丰' 和 '陈家沟陈王廷' 两大起源说。传统武术界和历史学界对此争论不休，但普遍认为陈王廷是公认的集大成者。",
          content: "关于太极拳的起源地，目前主要分为武当说和陈家沟说两大流派。武当说尊元末明初的道士张三丰为祖师，认为太极拳脱胎于道家的内丹修炼之术，是张三丰观察天地自然规律，结合内家拳理与养生之道创编而成，核心契合道家 “以柔克刚”“道法自然” 的理念。陈家沟说则有清晰的族谱和史料佐证，河南温县陈家沟的陈王廷在明末清初，将家传拳法、戚继光《拳经》中的招式，与道家导引、吐纳之术相融合，创编出一套刚柔并济的拳法，这套拳法世代传承并不断完善，最终奠定了现代太极拳的技术基础。"
        },
        { id: "modern", title: "近现代流派的发展", text: "从陈氏老架，如何演变为杨、武、吴、孙等主要流派。", content: "清朝中叶，太极拳的传承迎来了关键的转折期 —— 陈家沟陈氏太极拳传人陈长兴打破 “拳不外传” 的祖训，将拳法传授给慕名而来的河北永年人杨露禅。杨露禅天资过人且勤学苦练，学成后前往北京传拳，他结合京城贵族的健身需求，对原传拳法进行改良，简化了部分高难度动作，弱化了刚猛的发劲技巧，突出了动作的圆活舒展与柔和均匀，形成了杨氏太极拳的独特风格，迅速在京城风靡开来。此后，以杨氏太极拳的传播为契机，太极拳的发展进入流派分化的黄金阶段：武禹襄在学习杨氏拳法的基础上，结合自身武学体悟创编武式太极拳；吴鉴泉在杨氏拳架的基础上进一步细化动作规范，形成紧凑灵活的吴式太极拳；孙禄堂则融合形意拳、八卦掌的技法精髓，创编出圆活紧凑、转换灵活的孙式太极拳。尽管陈、杨、武、吴、孙等流派在拳架形态、动作节奏、发力方式上各具特色 —— 陈氏刚柔相济、发劲刚猛；杨氏舒展飘逸、柔和均匀；武式身法严谨、注重内气；吴式小巧灵活、紧凑连绵；孙式圆活紧凑、步活身灵 —— 但究其根本，都始终遵循太极 “阴阳相生、虚实转换、刚柔并济” 的核心哲学思想，这也是太极拳能够跨越地域与文化，从一门民间拳法发展为风靡全球的健身与武术项目的核心根基。" }
      ]
    },

    "二十四式": {
      title: "大道至简：简化二十四式太极拳详解",
      icon: <Award size={24} />,
      content: "简化二十四式太极拳是国家体育运动委员会在1956年组织创编的普及套路，结构简单、套路短小，易学易练，是全球习练者最多的太极拳套路之一。其宗旨是推广全民健身。",
      sections: [
        { id: "intro", title: "套路创编背景", content: "1956 年，为响应全民健身的时代号召，国家体育运动委员会牵头组织武术领域的专家学者，以流传广泛、动作柔和的杨氏太极拳为蓝本，对传统太极拳套路进行了科学提炼与简化。专家团队从传统杨氏太极拳的复杂招式中，筛选出二十四个最具代表性的核心动作，既保留了太极拳 “圆活连贯、虚实相生” 的精髓，又去除了原有套路中难度较高的发劲、跳跃等技法，同时优化了动作衔接的流畅度，最终创编出简化二十四式太极拳。这套简化拳法的显著特点是易学性强，动作路线清晰、难度适中，零基础的初学者也能快速上手；练习一套的时长仅需几分钟，耗时短、门槛低，无需专业场地，非常适合在学校、社区、公园等场景中开展，极大地降低了大众参与太极拳运动的门槛，成为推动太极拳走向全民普及的重要载体。" },
        { id: "structure", title: "动作结构概览", content: "简化二十四式太极拳共分为四段，整套拳法结构清晰、衔接流畅，既保留了传统太极拳的核心韵味，又兼顾了大众的学习难度，其核心动作涵盖了太极拳的经典招式：起势作为开篇，拉开整套拳法的韵律；随后的左右野马分鬃舒展圆活，尽显 “开合有序” 的特点；白鹤亮翅姿态轻盈，暗含虚实转换的巧劲。中段的搂膝拗步注重身法与步法的配合，手挥琵琶动作紧凑，强调以柔化劲；倒卷肱步步后退却劲力不散，揽雀尾更是集 “掤、捋、挤、按” 四式精髓于一体，是太极拳的核心技法。单鞭身姿舒展，气势贯通，云手则以腰为轴，动作如行云流水，尽显圆转之妙；高探马身形挺拔，探臂舒展，衔接自然。收尾部分以十字手合抱收势，动作沉稳，最后归于收势，整套拳法一气呵成，动静相宜。" },
        { id: "key", title: "关键动作分解", content: "简化二十四式太极拳中的诸多经典招式，不仅动作舒展圆活，更暗藏太极劲力的核心法门，是初学者领悟太极精髓的关键抓手：左右野马分鬃 强调内劲的撑开，动作开弓时需以腰为轴带动双臂，劲力从丹田生发，经由脊背传导至手掌，形成 “外开内合” 的张力，而非单纯依靠手臂的蛮力，尽显太极 “松柔中含刚劲” 的特点。白鹤亮翅 则着重虚实分明与沉肩坠肘，定式时一臂上扬如鹤翼舒展，另一手下按护腰，身形上虚下实，肩头要松沉不耸，肘部自然下垂，劲力含蓄于内，姿态既轻盈又沉稳，完美诠释太极 “虚实相生” 的要义。云手 更是太极 “腰为主宰” 理念的集中体现，动作中需以腰部的旋转带动双臂缠丝，双手如行云般交替划圆，劲力随腰胯的转动连绵传递，手臂的缠绕不是表面的画圈，而是内劲在肢体中流转的外在表现，练的是周身协调的整劲。" }
      ]
    },

    "哲学心法": {
      title: "哲学心法：阴阳、虚实与中定",
      icon: <Heart size={24} />,
      content: "太极拳不仅仅是肢体运动，更是中国古典哲学的具象化体现。核心在于 '阴阳' 的对立统一和 '虚实' 的不断转换。",
      sections: [
        { id: "yinyang", title: "阴阳平衡：动静相随", content: "在太极拳中，前进为阳，后退为阴；开为阳，合为阴。每一招式都是阴阳对立统一的体现，要求 '动之则分，静之则合'，达到平衡和谐。" },
        { id: "xushi", title: "虚实转换：四两拨千斤", content: "虚实是太极拳的灵魂，指重心的分配和意念的集中。一腿为实，一腿为虚。虚不是完全无力，实不是完全僵硬。虚实转换是实现 '四两拨千斤' 的技术基础。" },
        { id: "zhongding", title: "中定原则：立身中正", content: "中定指身体的中轴线必须始终保持垂直和稳定。这是发放劲力的前提，也是保护自身的关键。要求 '尾闾中正神贯顶'。" }
      ]
    },
  };

  const detail = DATA[itemId] || { title: "页面不存在", content: "请检查导航链接是否正确。", icon: <X size={24} />, sections: [] };

  return (
    <div className="fade-in max-w-5xl mx-auto pb-10">
      {/* 返回按钮和标题区域 */}
      <div className="mb-8 border-b pb-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition font-medium"
        >
          <ChevronRight className="rotate-180" size={18} /> 返回首页
        </button>
        <div className="text-right">
          <h2 className="text-3xl font-serif font-bold text-gray-900 flex items-center justify-end gap-2">{detail.icon} {detail.title}</h2>
          <p className="text-gray-500 mt-1">深度解析与学习资料</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 侧边栏/目录区域 (目录现在可以点击跳转) */}
        <div className="md:col-span-1 space-y-4 order-last md:order-first">
          <div className={`${THEME.card} rounded-xl p-6 sticky top-4`}>
            <h3 className="font-serif font-bold mb-4 text-gray-900 flex items-center gap-2"><BookOpen size={18} /> 目录概览</h3>
            <ul className="space-y-2">
              {/* 💥 修正：目录点击后跳转到锚点 */}
              {detail.sections.map((section, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition cursor-pointer">
                  {/* 使用 a 标签和 href="#id" 实现跳转 */}
                  <a href={`#${section.id}`} className="flex items-center gap-2 w-full p-1 -m-1 rounded hover:bg-gray-50">
                    <ChevronRight size={14} /> {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${THEME.card} rounded-xl p-6 bg-gray-50 text-center border-dashed border-gray-300`}>
            <p className="text-gray-500 text-sm">对本话题有疑问？</p>
            <button
              onClick={() => onNavigate('chat')}
              className="mt-3 w-full py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} /> 问 AI 助手
            </button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="md:col-span-2 space-y-6" id="main-content">
          {/* 核心观点/简介部分 */}
          <div className={`${THEME.card} rounded-xl p-8`}>
            <h3 className="text-xl font-bold font-serif mb-4 border-l-4 border-gray-900 pl-3">核心观点</h3>
            <p className="text-lg text-gray-700 leading-relaxed indent-8 text-justify">{detail.content}</p>
          </div>

          {/* 💥 修正：详细内容区域，为每个标题设置 ID 锚点 */}
          {detail.sections.map((section, index) => (
            <div key={index} className={`${THEME.card} rounded-xl p-8`}>
              {/* 锚点设置在这里，注意要使用 H 标签，以便在目录中更清晰 */}
              <h3 id={section.id} className="text-xl font-bold font-serif mb-4 border-l-4 border-gray-600 pl-3 pt-2">
                {section.title}
              </h3>
              <p className="text-gray-500 italic mb-4">{section.text}</p>
              <p className="text-gray-700 leading-relaxed indent-8 text-justify">{section.content}</p>
            </div>
          ))}

          {/* 补充或结语 */}
          <div className={`${THEME.card} rounded-xl p-8 bg-gray-50`}>
            <h3 className="text-xl font-bold font-serif mb-4 border-l-4 border-gray-300 pl-3">总结与延伸</h3>
            <p className="text-gray-500">太极拳的理论博大精深，建议通过反复练习和深入研读，体悟其中的精髓。</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default KnowledgeDetailPage;