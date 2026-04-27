import { CheckCircle2, Eye, Flag, GraduationCap, MessageSquareText, ShieldCheck } from 'lucide-react'
import type { Tutor } from '../../types'

export interface TutorDetailProps {
  tutor: Tutor
  buy: () => void
  enter: () => void
  back: () => void
}

export function TutorDetail({ tutor, buy, enter, back }: TutorDetailProps) {
  const monthlyEquiv = Math.round(tutor.year / 12)
  return (
    <section className="selection-page tutor-detail">
      <button className="back-link" onClick={back}>← 返回老师列表</button>

      <div className="tutor-detail-card">
        <img className="tutor-portrait large" src={tutor.avatar} alt={`${tutor.name} 头像`} />
        <div>
          <p className="eyebrow">{tutor.subject}</p>
          <h1>{tutor.name}</h1>
          <p className="tutor-subline">{tutor.title}</p>
          <div className="tutor-meta">
            <span><ShieldCheck size={12} /> {tutor.schoolTag}</span>
            <span>★ 评分 {tutor.rating}</span>
            <span><GraduationCap size={12} /> {tutor.students} 名学生在用</span>
          </div>
          <p className="tutor-bio">{tutor.bio}</p>

          <div className="tutor-price-row">
            <strong>¥{tutor.month}<small>/月起</small></strong>
            <span>年卡 ¥{tutor.year}（折合 ¥{monthlyEquiv}/月，省 ¥{tutor.month * 12 - tutor.year}）</span>
          </div>
          <div className="tutor-actions">
            {tutor.purchased ? (
              <button onClick={enter}><MessageSquareText size={14} /> 进入对话</button>
            ) : tutor.available ? (
              <>
                <button onClick={buy}><Eye size={14} /> 开始 7 天免费试看</button>
                <button className="ghost">查看完整套餐</button>
              </>
            ) : (
              <button disabled className="ghost">内测中，敬请期待</button>
            )}
          </div>
        </div>
      </div>

      <div className="sample-box">
        <p className="eyebrow">试看样例</p>
        <strong>同样一道题，{tutor.name} 是这么讲的</strong>
        <div className="sample-chat">
          <div className="msg student">学生：动量守恒什么时候能用？</div>
          <div className="msg teacher">
            <img src={tutor.avatar} alt="" />
            <div>
              <em>{tutor.name}</em>
              <p>先别急着背公式。你先看三件事：研究系统是谁？外力冲量能不能忽略？过程是不是短时间相互作用？这三件事都成立，才轮到守恒。</p>
            </div>
          </div>
          <div className="msg teacher">
            <img src={tutor.avatar} alt="" />
            <div>
              <em>{tutor.name}</em>
              <p>记住：动量守恒不是看到碰撞就守恒，是先验条件再列方程。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fit-block">
        <div className="fit-col">
          <p className="eyebrow tone-success">适合这样的孩子</p>
          <ul>
            <li><CheckCircle2 size={14} /> 听课能听懂，但一做题就不知道从哪下手</li>
            <li><CheckCircle2 size={14} /> 想冲 90+ 但卡在压轴题</li>
            <li><CheckCircle2 size={14} /> 喜欢有方法的讲法，不喜欢死记硬背</li>
          </ul>
        </div>
        <div className="fit-col">
          <p className="eyebrow tone-amber">暂不适合</p>
          <ul>
            <li><Flag size={14} /> 物理基础尚未建立，先去听系统课</li>
            <li><Flag size={14} /> 只想要答案、不想自己思考的学生</li>
            <li><Flag size={14} /> 初中及以下学段</li>
          </ul>
        </div>
      </div>

      <div className="guarantee-block">
        <ShieldCheck size={28} />
        <div>
          <strong>给家长的承诺</strong>
          <p>7 天内不满意全额退款。每条 AI 回答都标注由 {tutor.name} 老师审核，可追溯。未审核的答题不会发到学生面前。</p>
        </div>
      </div>
    </section>
  )
}
