// Order of service and Modern Service liturgy used at the Sunday youth service,
// from the printed booklet (public/liturgy/youth-service-liturgy.pdf).

export const LITURGY_PDF = "/liturgy/youth-service-liturgy.pdf";

const ORDER_OF_SERVICE = ["Praise and Worship", "Intercessory Session", "Notices and Testimonies", "Sermon", "Offertory", "Benediction"];

// Each line: [role, text]. Roles: leader, all, minister, note (a rubric such
// as "People Stand"), sung (a sung refrain).
const LITURGY = [
    {
        lines: [
            ["leader", "The Lord be with you."],
            ["all", "And also with you."],
            ["leader", "We have come together, the people of God, drawn by his spirit, longing for his word, to praise the holy name of the Lord, to share his glorious news of grace, to pray for our needs and the pain of the world, to rejoice in his love and be sent in his peace."],
            ["leader", "We are heirs of the Father;"],
            ["all", "joint heirs with the Son."],
            ["leader", "Renewed in the Spirit;"],
            ["all", "Together we are one."],
        ],
    },
    {
        title: "Confession",
        lines: [
            ["leader", "If we say we have no sin, we deceive ourselves and there is no truth in us. If we confess our sins, in repentance and trust, God is faithful and just, and will forgive us our sins. So let us confess them to our Father."],
            ["note", "People kneel or sit"],
            ["all", "Eternal Father, God of our ancestors, before your power all things tremble but through your Son, we approach your throne. We have done wrong and neglected to do right; our sins weigh heavily on our hearts: Lord have mercy, count them not against us. Grant us the joy of forgiveness and lighten our hearts with the glory of Christ, who died and rose again for us. Amen."],
            ["minister", "The God and Father of our Lord Jesus Christ rejoices at repentance and declares his acceptance. The dead are alive, the lost are found. His goodness and mercy will follow you all the days of your life, and you will live in the house of the Lord for ever. Amen."],
            ["leader", "Blessed are those who live in your house:"],
            ["all", "They will be always singing your praise."],
            ["leader", "Praise the Lord."],
            ["all", "The name of the Lord be praised."],
            ["note", "People stand"],
            ["leader", "Glory to the Father to whom all things began,"],
            ["all", "Glory to the Son who became the Son of Man, Glory to the Spirit who inspires and renews, The Lord our God for ever! Alleluia!"],
        ],
    },
    {
        title: "Jubilate Song (Song of Joy)",
        subtitle: "Psalm 100",
        song: [
            "I will enter his gates with thanksgiving in my heart:",
            "I will enter his courts with praise.",
            "I will say this is the day that the Lord has made:",
            "I will rejoice for he has made me glad.",
            ["He has made me glad, he has made me glad:"],
            "I will rejoice for he has made me glad.",
            ["He has made me glad, he has made me glad:"],
            "I will rejoice for he has made me glad.",
        ],
    },
    {
        title: "The Apostles' Creed",
        lines: [
            ["leader", "We stand with Christians throughout the centuries and throughout the world today, to affirm our faith in the words of the Apostles' Creed."],
            ["all", "I believe in God, the Father Almighty, creator of heaven and earth. I believe in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended to the dead. On the third day he rose again; he ascended into heaven, he is seated at the right hand of the Father, and he will come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and the life everlasting. Amen."],
        ],
    },
    {
        title: "Prayers",
        lines: [
            ["leader", "The Lord be with you."],
            ["all", "And also with you."],
            ["leader", "Let us pray."],
            ["note", "People kneel and sing"],
            ["all", "Ask, and it shall be given unto you; seek, and you shall find; knock, and the door shall be opened unto you."],
            ["sung", "Allelu, alleluia"],
            ["leader", "As our Saviour taught us, so we pray:"],
        ],
        lordsPrayer: true,
        after: [
            ["leader", "Show us your mercy, O Lord;"],
            ["all", "and grant us your salvation."],
            ["leader", "O Lord, guide our President;"],
            ["all", "and give him your wisdom and justice."],
            ["leader", "May your ministers serve you faithfully;"],
            ["all", "and your people joyfully."],
            ["leader", "In the valley of the shadow of death;"],
            ["all", "protect us with your rod and staff."],
            ["leader", "Like trees planted by the waterside,"],
            ["all", "grant us the fruit of your Spirit."],
            ["leader", "Send us out as the salt of the earth;"],
            ["all", "and as the light of the world."],
            ["leader", "May the earth be filled with your glory;"],
            ["all", "as the waters cover the sea."],
        ],
    },
];

const LORDS_PRAYER = [
    "Our Father in heaven,", "holy be your name,", "your kingdom come,", "your will be done,", "on earth as in heaven.",
    "Give us today our daily bread.", "Forgive us our sins,", "as we forgive those", "who sin against us.",
    "Do not bring us to the test", "but deliver us from evil.", "For the kingdom, the power and the glory are yours",
    "now and for ever.",
];

// Each prayer may have alternatives, said instead of the first ("or").
const PRAYERS = [
    {
        title: "Prayer for Peace",
        texts: [
            "Almighty and everlasting God, Father of the Prince of peace, in returning and rest we are saved, in quietness and trust is our strength. Grant us the blessing of making peace, and the joy of seeking justice. Take from our souls all strain and stress, and let our ordered lives confess, the beauty of your peace; through Jesus Christ our Lord.",
            "O God, creator of peace and lover of unity, through knowing you we have eternal life, and in serving you we find perfect freedom. Defend us in all attacks of our enemies, so that trusting only in your defence, we may be free from all fear; through the power of Jesus Christ our Lord.",
        ],
    },
    {
        title: "Prayer for Grace",
        texts: [
            "Almighty God, you have been our Guard through the night, keep us in your care through the day; walking in the light, bearing witness to your way, seeking first your kingdom and seeing you in everyone; guide us in the footsteps of your Son, and lead us on the path to your everlasting Day: through Jesus Christ our Lord.",
            "Lord, our heavenly Father, Almighty and ever living God, who has brought us safely to the beginning of this day. Protect us today with your mighty power, so that we do not fall into any sin, or meet any danger; but all our deeds may be directed by you, and that we may do every day what is good in your sight; through Jesus Christ our Lord.",
        ],
    },
    {
        title: "Prayer for the Nation",
        texts: ["Almighty God, you rule all nations and direct them according to your will. We pray that you will guide our President and all leaders of our country, so that they may always use the authority which you have given them for the peace of the world, the benefit, honour and development of our nation, and the good of your holy Church; through Jesus Christ our Lord."],
    },
    {
        title: "Prayer for the Church",
        texts: ["Almighty and eternal God, the only source of power. Grant to our bishops, pastors, and all the people of our churches your health-giving Spirit of grace; and, in order that they may truly please you, pour on them the continual dew of your blessing. Grant this for the sake of our advocate and mediator, Jesus Christ."],
    },
    {
        title: "Prayer of Saint Chrysostom",
        texts: ["Almighty God, by your grace we have come together at this time to bring our united prayers to you; and you have promised by your Son Jesus Christ, that where two or three are gathered in his name he will be in the midst of them. Fulfil now, O Lord, our desires and petitions as may be best for us; granting us in this world knowledge of your truth, and in the world to come life everlasting; through Jesus Christ our Lord."],
    },
];

const ROLE_LABELS = { leader: "Leader", all: "All", minister: "Minister" };

function Line({ role, text }) {
    if (role === "note") return <p className="lit-note">({text})</p>;
    if (role === "sung") return <p className="lit-sung">{text}</p>;
    return (
        <p className={`lit-line lit-${role}`}>
            <span className="lit-role">{ROLE_LABELS[role]}</span>
            <span>{text}</span>
        </p>
    );
}

export default function LiturgyPage() {
    return (
        <>
            <div className="section section-navy" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
                <div className="container" style={{ textAlign: "center" }}>
                    <div className="overline">Sunday Youth Service</div>
                    <h1 className="section-title white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>Order of Service &amp; Liturgy</h1>
                    <p className="section-desc white" style={{ margin: "0 auto 1.75rem" }}>
                        The Modern Service liturgy we pray together every Sunday at ACK St Paul's Cathedral Youth, Embu. Follow along on your phone during the service.
                    </p>
                    <a className="btn btn-gold" href={LITURGY_PDF} download="ACK-St-Pauls-Youths-Order-of-Service.pdf">Download the PDF booklet</a>
                </div>
            </div>

            <div className="section section-cream">
                <div className="container lit-wrap">
                    <div className="card lit-order">
                        <div className="overline">Order of Service</div>
                        <ol>{ORDER_OF_SERVICE.map(item => <li key={item}>{item}</li>)}</ol>
                    </div>

                    <div className="lit-key">
                        <span><span className="lit-role">Leader</span> said by the leader</span>
                        <span><span className="lit-role lit-role-all">All</span> said by everyone, in bold</span>
                    </div>

                    <h2 className="section-title lit-heading">Modern Service Liturgy</h2>

                    {LITURGY.map((part, i) => (
                        <section key={part.title || i} className="lit-part">
                            {part.title && <h3 className="lit-title">{part.title}{part.subtitle && <small>{part.subtitle}</small>}</h3>}
                            {part.lines?.map(([role, text], j) => <Line key={j} role={role} text={text} />)}
                            {part.song && (
                                <div className="card lit-song">
                                    {part.song.map((line, j) => Array.isArray(line)
                                        ? <p key={j} className="lit-sung">{line[0]}</p>
                                        : <p key={j}><strong>{line}</strong></p>)}
                                </div>
                            )}
                            {part.lordsPrayer && (
                                <div className="card lit-lords-prayer">
                                    <h4>The Lord's Prayer</h4>
                                    {LORDS_PRAYER.map(line => <p key={line}>{line}</p>)}
                                    <p className="lit-amen">Amen.</p>
                                </div>
                            )}
                            {part.after?.map(([role, text], j) => <Line key={j} role={role} text={text} />)}
                        </section>
                    ))}

                    <h2 className="section-title lit-heading">Prayers</h2>
                    {PRAYERS.map(prayer => (
                        <section key={prayer.title} className="lit-part">
                            <h3 className="lit-title">{prayer.title}</h3>
                            {prayer.texts.map((text, j) => (
                                <div key={j}>
                                    {j > 0 && <p className="lit-or">or</p>}
                                    <p className="lit-prayer">{text} <strong className="lit-amen">Amen.</strong></p>
                                </div>
                            ))}
                        </section>
                    ))}

                    <div style={{ textAlign: "center", marginTop: "3rem" }}>
                        <a className="btn btn-navy" href={LITURGY_PDF} download="ACK-St-Pauls-Youths-Order-of-Service.pdf">Download the PDF booklet</a>
                    </div>
                </div>
            </div>
        </>
    );
}
