t_world{
  //#define LIKE_INT(F)F(t_wms_id)F(t_oper_id)
  t_wms{
    t_wms_id id;
    string name;
    t_amount total_fee;
  };
  t_amount_with_wms{
    t_wms_id id;
    t_amount value;
  }
  t_oper{
    t_oper_id oper_id;
    t_user_id user_id;
    t_amount_with_wms inp;
    t_amount_with_wms out;
    //t_wm_timestamp time; this is part of external representation
    bool check_dir(const t_oper&ref)const{return ref.inp.id==inp.id&&ref.out.id==out.id;}
    bool check_rev(const t_oper&ref)const{return ref.out.id==inp.id&&ref.inp.id==out.id;}
    bool deaded()const{return !inp.value||!out.value;}
    t_rate inout_rate()const{return inp/out;}
    void make_reverse_from(const t_oper&ref){
      b.user_id=ref.user_id;
      b.inp.id=ref.out.id;
      b.out.id=ref.inp.id;
    }
  };
  vector<t_oper> opers;
  //vector<t_oper_id> our_opers; bool is_our(t_oper_id oper_id);
  
  vector<t_wms> wms;
  t_move_join{
    t_oper_id main; // main=opers[$].oper_id; assert(is_our(main));
    t_oper_id attachable; // attachable=opers[$].oper_id; assert(is_our(attachable)); assert(get(main).inp.id==get(attachable).inp.id);
  };
  t_move_split{
    t_oper_id src_oper_id; // src_oper_id=opers[$].oper_id; assert(is_our(src_oper_id));
    t_amount inp; // inp=get(src_oper_id).inp.value-$; assert(inp>0.01);
    t_amount_with_wms out; // out.id=$; out.value=$;
  };
  void gen(vector<t_move_split>&out){
    
  }
  void use(t_move_split m){
    auto&b=qap_add_back(opers);
    b.user_id=context.user_id;
    b.oper_id=context.gen_new_oper_id();
    if(auto*p=get(m.src_oper_id))
    {
      auto&src_inp=p->inp;
      QapAssert(src_inp.value>=m.inp);
      src_inp.value-=m.inp;
      b.inp.id=src_inp.id;
      b.inp.value=m.inp;
      b.out=m.out;
    }
  }
  t_move_payment{
    t_oper_id our; // our=opers[$].oper_id; assert(is_our(our));
    t_oper_id dest; // dest=opers[$].oper_id; assert(!is_our(dest)); assert(get(our).inp.id==get(dest).out.id); assert(get(our).out.id==get(dest).inp.id);
  }
  void transfer_impl(t_amount_with_wms&src,t_amount_with_wms&dest,t_fee fee,t_amount amount){
    QapAssert(src.id==dest.id);
    src.value-=amount;
    dest.value+=amount.minus(fee);
    wms[src.id].total_fee+=fee.from(amount);
  }
  t_oper&reverse_from(t_oper&ref){
    auto rid=QAP_MINVAL_ID_OF_VEC(QAP_FILTER(opers,!ex.deaded()&&ex.user_id==ref.user_id&&ex.check_rev(ref)),ex.inout_rate());
    if(qap_check_id(opers,rid))return opers[rid];
    QapAssert(rid==-1);
    rid=opers.size();
    auto&b=qap_add_back(opers);
    b.oper_id=context.gen_new_oper_id();
    b.make_reverse_from(ref);
    return b;
  }
  void use(t_move_payment m){
    if(opers.capacity()<opers.size()+2)opers.reserve(opers.capacity()*2);
    QapAssert(is_our(m.our));auto*pour=get(m.our);QapAssert(pour);auto&A=*pour;
    QapAssert(!is_our(m.dest));auto*pdest=get(m.dest);QapAssert(pdest);auto&P=*pdest;
    QapAssert(A.inp.id==P.out.id);
    QapAssert(A.out.id==P.inp.id);
    auto&Ar=reverse_from(A);
    auto&Pr=reverse_from(P);
    
    auto WMR=A.inp;
    auto how_much_u_have_WMZ=P.inp;
    auto WMZ_div_WMR=P.inout_rate();
    auto how_much_am_i_trying_to_bought_WMZ=WMZ_div_WMR*WMR;
    auto how_much_u_need_to_transfer_WMZ=std::min(how_much_am_i_trying_to_bought_WMZ,how_much_u_have_WMZ);
    auto how_much_i_need_to_transfer_WMR=how_much_u_need_to_transfer_WMZ/WMZ_div_WMR;
    QapAssert(how_much_i_need_to_transfer_WMR<=WMR);
    QapAssert(how_much_u_need_to_transfer_WMZ<=how_much_u_have_WMZ);
    transfer.from(A.inp).to(Pr.inp).fee(fee_0_0015).amount(how_much_i_need_to_transfer_WMR);
    transfer.from(P.inp).to(Ar.inp).fee(fee_0_0025).amount(how_much_u_need_to_transfer_WMZ);
  }
}