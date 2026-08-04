"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";
import "../dashboard.css";


export default function CareRequestPage(){


const [patientName,setPatientName] = useState("");
const [serviceType,setServiceType] = useState("일반 간병");
const [address,setAddress] = useState("");
const [startDate,setStartDate] = useState("");
const [endDate,setEndDate] = useState("");
const [content,setContent] = useState("");

const [message,setMessage] = useState("");
const [loading,setLoading] = useState(false);



async function submitRequest(){


setLoading(true);



const {
data:userData
}
=
await supabase.auth.getUser();



const user=userData.user;



if(!user){

window.location.href="/login";
return;

}





const {
data:guardian
}
=
await supabase
.from("guardians")
.select("id")
.eq("user_id",user.id)
.maybeSingle();



if(!guardian){


setMessage(
"보호자 정보가 없습니다."
);

setLoading(false);

return;

}




const {error}=await supabase
.from("care_requests")
.insert({


guardian_id:guardian.id,

patient_name:patientName,

service_type:serviceType,

address:address,

start_date:startDate,

end_date:endDate,

request_status:"waiting",

content:content


});





if(error){

setMessage(error.message);

setLoading(false);

return;

}




setMessage(
"간병 신청이 완료되었습니다. 케어택에서 매칭을 진행합니다."
);



setPatientName("");
setAddress("");
setStartDate("");
setEndDate("");
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
href="/vip"
>
VIP 전담간병
</a>



</div>


</header>







<section className="dashboardHero">


<span className="eyebrow">
CARE REQUEST
</span>


<h1>
간병 서비스 신청
</h1>


<p>
검증된 간병인과 안전하게 연결해드립니다.
</p>


</section>







<section className="dashboardSection">


<div className="dashboardCard">


<h2>
간병 신청 정보
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
서비스 유형
</label>


<select

value={serviceType}

onChange={(e)=>
setServiceType(e.target.value)
}

>


<option>
일반 간병
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


<option>
VIP 전담간병
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

placeholder="예) 서울 강남구"

/>


</div>







<div className="formGroup">

<label>
서비스 시작일
</label>


<input

type="date"

value={startDate}

onChange={(e)=>
setStartDate(e.target.value)
}

/>


</div>







<div className="formGroup">

<label>
서비스 종료일
</label>


<input

type="date"

value={endDate}

onChange={(e)=>
setEndDate(e.target.value)
}

/>


</div>







<div className="formGroup">

<label>
상세 요청사항
</label>


<textarea

value={content}

onChange={(e)=>
setContent(e.target.value)
}

placeholder="환자 상태, 필요한 도움 내용을 입력해주세요."

/>


</div>







<button

className="smallPrimary dashboardButton"

onClick={submitRequest}

disabled={loading}

>


{
loading
?
"신청 중..."
:
"간병 신청하기"
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
