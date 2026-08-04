"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";
import "../dashboard.css";


export default function VipPage() {


const [patientName,setPatientName] = useState("");
const [phone,setPhone] = useState("");
const [serviceType,setServiceType] = useState("VIP 24시간 간병");
const [address,setAddress] = useState("");
const [content,setContent] = useState("");

const [message,setMessage] = useState("");
const [loading,setLoading] = useState(false);



async function submitVip(){


setLoading(true);



const {
data:userData
}
=
await supabase.auth.getUser();



const user = userData.user;



if(!user){

window.location.href="/login";
return;

}



const {error} = await supabase
.from("customer_support")
.insert({

user_id:user.id,

category:"VIP",

title:`VIP 상담 - ${patientName}`,

status:"waiting",

message:
`
환자명: ${patientName}

연락처: ${phone}

서비스:
${serviceType}

지역:
${address}

상담내용:
${content}
`

});



if(error){

setMessage(error.message);
setLoading(false);
return;

}



setMessage(
"VIP 전담간병 상담 신청이 완료되었습니다."
);


setPatientName("");
setPhone("");
setAddress("");
setContent("");

setLoading(false);


}




return (


<main className="dashboardPage">



<header className="dashboardHeader">


<a
className="brand"
href="/"
>

<span className="brandMark">
C
</span>

<span>
케어택
</span>

</a>



<div className="headerActions">

<a
className="textButton"
href="/mypage"
>
마이페이지
</a>


<a
className="textButton"
href="/care-request"
>
간병 신청
</a>


</div>


</header>






<section className="dashboardHero">


<span className="eyebrow">
CARETAK VIP
</span>


<h1>

VIP 전담간병 서비스

</h1>


<p>

24시간 집중 관리가 필요한 가족을 위한
프리미엄 간병 매칭 서비스

</p>


</section>







<section className="dashboardSection">


<div className="dashboardCard">


<h2>
VIP 상담 신청
</h2>



<div className="formGroup">


<label>
환자 성함
</label>


<input

value={patientName}

onChange={(e)=>
setPatientName(e.target.value)
}

placeholder="환자 성함 입력"

/>


</div>





<div className="formGroup">


<label>
연락처
</label>


<input

value={phone}

onChange={(e)=>
setPhone(e.target.value)
}

placeholder="010-0000-0000"

/>


</div>






<div className="formGroup">


<label>
서비스 유형
</label>


<select

value={serviceType}

onChange={(e)=>
setServiceType(e.target.value)
}

>


<option>
VIP 24시간 간병
</option>


<option>
병원 동행
</option>


<option>
재활 케어
</option>


<option>
치매 전문 케어
</option>


</select>


</div>







<div className="formGroup">


<label>
희망 지역
</label>


<input

value={address}

onChange={(e)=>
setAddress(e.target.value)
}

placeholder="지역 입력"

/>


</div>







<div className="formGroup">


<label>
상담 내용
</label>


<textarea

value={content}

onChange={(e)=>
setContent(e.target.value)
}

placeholder="필요한 간병 내용을 입력해주세요"

/>


</div>






<button

className="smallPrimary dashboardButton"

onClick={submitVip}

disabled={loading}

>


{
loading
?
"신청 중..."
:
"VIP 상담 신청"
}


</button>





{

message &&

<p className="formMessage">

{message}

</p>

}



</div>


</section>






</main>


);


}
