import { Clock, GraduationCap, UsersRound } from 'lucide-react'
import type { Tutor } from '../../types'

export interface TutorStoryProps {
  tutor: Tutor
  back: () => void
  buy: () => void
}

// X 老师老师真人故事页（虚构 demo 用，可作为后续找真老师谈合作的样板）
export function TutorStory({ tutor, back, buy }: TutorStoryProps) {
  return (
    <main className="tutor-story">
      <header className="library-nav">
        <button className="back-link" onClick={back}>← 返回</button>
      </header>
      <article className="tutor-story-article">
        <div className="story-hero">
          <img className="tutor-portrait xlarge" src={tutor.avatar} alt={tutor.name} />
          <div>
            <p className="eyebrow">名师档案</p>
            <h1>{tutor.name}</h1>
            <p className="story-tag">{tutor.schoolTag}</p>
            <div className="story-meta">
              <span><GraduationCap size={14} /> 北京师范大学物理学院硕士</span>
              <span><Clock size={14} /> 教龄 12 年 · 2023 年从机构出来单干</span>
              <span><UsersRound size={14} /> 累计带过 200+ 名高中学生</span>
            </div>
          </div>
        </div>

        <section>
          <h2>从机构金牌到独立教师</h2>
          <p>北京师范大学物理学院硕士毕业后，我加入了XXX 机构，专门带高考物理一对一。在机构的 9 年里，我连续 5 年拿到金牌教师评级，所带学生续费率长期在分校第一梯队。</p>
          <p>2023 年我决定从机构出来单干。原因很简单——机构定价 ¥600-800/小时，但能跟我的学生 90% 是一线城市中产家庭。我想找一个方式，能让更多家庭付得起、又不掉教学质量。</p>
          <p>所以当 PhysicsPath 团队找到我，说要把我的解题方法做成 AI 分身的时候，我同意了。条件只有一个：每一条 AI 给出去的答案，都得是我审过的路径，不能让 AI 替我"自由发挥"。</p>
        </section>

        <section>
          <h2>我的教学方法</h2>
          <p><strong>第一原则：物理题先看明白，再列公式。</strong>我带学生最常说的一句话是"对象、过程、条件"——研究对象是谁？经历了什么过程？哪些条件成立？这三件事看清楚，公式自然就出来了。背模板的学生在简单题上能拿分，但一遇到压轴题就卡住，因为压轴题考的不是公式，是看题的能力。</p>
          <p><strong>第二原则：解题路径比答案重要。</strong>我从不直接讲答案。我会问："这道题第一步该判断什么？""为什么选这个对象？""这个条件能不能用守恒？"——把问题反过来抛给学生，让他自己走完路径。一道题做对了不算会，能讲出"我为什么这样想"才算会。</p>
          <p><strong>第三原则：错题比对题宝贵。</strong>我所有学生都有错题本，但不是抄题——是抄"我当时是怎么想错的"。每周我会挑 3 道全班错得最多的题，让学生轮流上来讲自己当时的思路。讲错的过程比讲对的过程更能暴露问题。</p>
        </section>

        <section>
          <h2>带过的学生</h2>
          <ul className="story-students">
            <li><strong>王同学（2022 届）</strong>：高一物理 62 分，跟我两年后高考 96 分，现就读清华大学工程物理系。她最大的进步不是分数，是从"看到题就翻笔记找公式"变成"看到题先问自己研究对象是谁"。</li>
            <li><strong>李同学（2023 届）</strong>：电磁感应一直是弱项，压轴题全靠蒙。我带他用了一学期"先判磁通量变化、再判方向、最后算电动势"的三步法，高考压轴题拿满分。</li>
            <li><strong>张同学（2024 届）</strong>：基础不差但综合题丢步骤分严重。我让他每道题都先画"研究对象 + 过程图"，再列方程。高考物理 92 分，现就读上海交通大学。</li>
          </ul>
        </section>

        <section>
          <h2>为什么愿意做 AI 分身</h2>
          <p>退休之后，每天能教的学生从 60 个变成 0 个。但中国还有几百万高三学生，他们大多数请不起一对一名师辅导。如果 AI 能把我的方法复制给更多孩子——前提是不走样、不胡说——这件事我愿意做。</p>
          <p>所以 PhysicsPath 上每一条 AI 回答都标注由我审核，可追溯。未审核的答题不会发到学生面前。这是我对家长和学生的承诺。</p>
        </section>

        <div className="story-cta">
          <button onClick={buy}>跟X 老师练物理 →</button>
          <span>¥299/月 · 7 天无理由退款</span>
        </div>
      </article>
    </main>
  )
}
